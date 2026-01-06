"""
Legislative RAG Agent

Combines retrieval and generation for enhanced legislative analysis.
"""

import logging
import requests
from typing import List, Dict, Optional
from .retriever import HybridRetriever
from .indexer import DocumentIndexer, ChunkRecord

logger = logging.getLogger(__name__)


class LegislativeRAGAgent:
    """
    RAG agent for legislative document analysis.
    
    Combines document retrieval with LLM generation for
    context-aware legislative artifact creation.
    """
    
    def __init__(
        self,
        indexer: DocumentIndexer,
        retriever: Optional[HybridRetriever] = None,
        ollama_url: str = "http://localhost:11434",
        model: str = "llama3.2:latest"
    ):
        """
        Initialize the RAG agent.
        
        Args:
            indexer: Document indexer
            retriever: Hybrid retriever (creates one if not provided)
            ollama_url: Ollama API URL
            model: LLM model name
        """
        self.indexer = indexer
        self.retriever = retriever or HybridRetriever(indexer)
        self.ollama_url = ollama_url
        self.model = model
    
    def generate_with_rag(
        self,
        query: str,
        artifact_type: str = "Executive Summary",
        tone: str = "Professional",
        additional_instructions: str = "",
        top_k: int = 5,
        filters: Optional[Dict] = None,
        system_persona: Optional[str] = None
    ) -> Dict:
        """
        Generate a legislative artifact using RAG.
        
        Args:
            query: Query or topic for generation
            artifact_type: Type of artifact to generate
            tone: Tone/voice for generation
            additional_instructions: Additional instructions
            top_k: Number of chunks to retrieve
            filters: Optional metadata filters
            
        Returns:
            Dictionary with generated content and sources
        """
        # Retrieve relevant chunks
        logger.info(f"Retrieving top {top_k} chunks for query: {query}")
        chunks = self.retriever.retrieve(query, top_k=top_k, filters=filters)
        
        if not chunks:
            return {
                "content": "No relevant documents found for the query.",
                "sources": [],
                "chunks_used": 0
            }
        
        # Build context from chunks
        context = self._build_context(chunks)
        
        # Generate prompt
        prompt = self._create_prompt(
            query=query,
            context=context,
            artifact_type=artifact_type,
            tone=tone,
            additional_instructions=additional_instructions,
            system_persona=system_persona
        )
        
        # Generate with LLM
        logger.info(f"Generating {artifact_type} with {len(chunks)} chunks")
        generated_text = self._call_ollama(prompt)
        
        # Build source citations
        sources = [
            {
                "file": chunk.source_file,
                "bill": chunk.bill_number,
                "sender": chunk.sender,
                "position": chunk.position,
                "relevance": round(chunk.relevance_score, 2),
                "preview": chunk.text[:200] + "..." if len(chunk.text) > 200 else chunk.text
            }
            for chunk in chunks
        ]
        
        return {
            "content": generated_text,
            "sources": sources,
            "chunks_used": len(chunks),
            "query": query,
            "artifact_type": artifact_type
        }
    
    def chat_with_rag(
        self,
        message: str,
        history: List[Dict] = None,
        system_persona: Optional[str] = None,
        top_k: int = 5,
        filters: Optional[Dict] = None
    ) -> Dict:
        """
        Chat with the RAG agent.
        
        Args:
            message: User message
            history: List of past messages [{'role': 'user', 'content': '...'}, ...]
            system_persona: Optional persona override
            top_k: Chunks to retrieve
            filters: Metadata filters
            
        Returns:
            Dictionary with answer and sources
        """
        history = history or []
        
        # 1. Retrieve relevant context based on current message
        logger.info(f"Chat retrieval for: {message}")
        chunks = self.retriever.retrieve(message, top_k=top_k, filters=filters)
        
        # 2. Build context
        context = self._build_context(chunks) if chunks else "No relevant document chunks found."
        
        # 3. Create chat prompt
        prompt = self._create_chat_prompt(
            message=message,
            history=history,
            context=context,
            system_persona=system_persona
        )
        
        # 4. Generate answer
        answer = self._call_ollama(prompt)
        
        # 5. Format sources
        sources = [
            {
                "file": chunk.source_file,
                "bill": chunk.bill_number,
                "sender": chunk.sender,
                "position": chunk.position,
                "relevance": round(chunk.relevance_score, 2),
                "text": chunk.text
            }
            for chunk in chunks
        ]
        
        return {
            "answer": answer,
            "sources": sources,
            "chunks_used": len(chunks)
        }
    
    def _build_context(self, chunks: List[ChunkRecord]) -> str:
        """Build context string from retrieved chunks."""
        context_parts = []
        
        for i, chunk in enumerate(chunks, 1):
            context_parts.append(f"═══ SOURCE {i} ═══")
            context_parts.append(f"File: {chunk.source_file}")
            if chunk.bill_number:
                context_parts.append(f"Bill: {chunk.bill_number}")
            if chunk.sender:
                context_parts.append(f"Sender: {chunk.sender}")
            if chunk.position:
                context_parts.append(f"Position: {chunk.position}")
            context_parts.append(f"Relevance: {chunk.relevance_score:.1f}%")
            context_parts.append("")
            context_parts.append(chunk.text)
            context_parts.append("")
        
        return "\n".join(context_parts)
    
    def _create_prompt(
        self,
        query: str,
        context: str,
        artifact_type: str,
        tone: str,
        additional_instructions: str,
        system_persona: Optional[str] = None
    ) -> Dict[str, str]:
        """Create the generation prompt and system instruction."""
        
        # Artifact-specific instructions
        instructions = {
            "Executive Summary": """Structure:
1. **Issue Overview**: Core legislative issue and context.
2. **Stakeholder Positions**: Summary of support vs opposition.
3. **Critical Arguments**: Main points from both sides.
4. **Legislative Landscape**: Current status and likely outcome.""",
            
            "Talking Points (Pro)": """ persuasive Talking Points SUPPORTING the legislation:
- Strongest argument first.
- Context-driven examples.
- Constituent benefits.
- Concise 1-2 sentence points.""",
            
            "Talking Points (Con)": """ persuasive Talking Points OPPOSING the legislation:
- Primary concern first.
- Specific problems from testimony.
- Unintended consequences.
- Concise 1-2 sentence points.""",
            
            "Vote Recommendation": """Memo with:
1. **Recommendation**: Clear AYE or NO with rationale.
2. **Policy Analysis**: Key merits and flaws.
3. **Political Considerations**: Impact on district/constituents.
4. **Risk Assessment**: Potential fallout.""",
            
            "Coalition Letter": """Draft a letter with:
- Clear call to action (Vote YES/NO).
- Unified voice.
- 2-3 strongest shared arguments.
- Specific request and deadline.""",
            
            "Opposition Research": """Identify:
- Contradictory arguments.
- Unsupported claims.
- Controversial statements.
- Strategic vulnerabilities.""",

            "Policy Analysis": """Analysis covering:
1. **Legal Framework**: Interaction with existing laws.
2. **Impact**: Economic and social consequences.
3. **Implementation**: Practical hurdles and agency burden.""",

            "Policy Recommendations": """Recommendations:
1. **Adjustments**: Improvements to the current bill.
2. **Future Legislation**: Related issues for next session.
3. **Action Plan**: Immediate next steps.""",

            "Press Release": """Release:
- Catchy headline.
- Core details and significance.
- Compelling stakeholder quote.
- Brief background/boilerplate.""",

            "Social Media Suite": """Feed content:
- **X/Twitter**: 3-5 thread posts.
- **LinkedIn**: Thought leadership post.
- **Instagram/Facebook**: High-impact captions.
- Tone: Engaging and informative.""",

            "Committee Briefing": """Briefing:
1. **Bottom Line**: 30-second summary.
2. **Key Questions**: Hard questions for witnesses.
3. **Political Temperature**: Likely positions of members."""
        }
        
        goal_instruction = instructions.get(artifact_type, "Analyze and synthesize documents.")
        
        persona = system_persona or "You are a senior legislative analyst with expertise in California state politics and policy analysis."
        
        # SYSTEM INSTRUCTIONS: The 'Rules of Engagement'
        system_rules = f"""{persona}

CRITICAL RULES:
- OUTPUT ONLY the requested artifact in Markdown.
- NO introductory chatter (e.g., "I've created the suite...")
- NO concluding disclaimers or summary notes.
- NO repeating the instructions or prompt headers.
- DO NOT mention being an AI or a social media expert.
- Start directly with: # {artifact_type}
- Use specific details from the sources provided.
"""

        # USER PROMPT: The 'Specific Task'
        user_prompt = f"""Generate: {artifact_type}
Topic/Query: {query}
Tone: {tone}
{f'Special Instructions: {additional_instructions}' if additional_instructions else ''}

Output Goal: {goal_instruction}

RETRIEVED DOCUMENT CONTEXT:
{context}

Begin generating the artifact now:"""
        
        return {"system": system_rules, "prompt": user_prompt}
    
    def _create_chat_prompt(
        self,
        message: str,
        history: List[Dict],
        context: str,
        system_persona: Optional[str] = None
    ) -> Dict[str, str]:
        """Create a prompt for chat-based interaction."""
        persona = system_persona or "You are a senior legislative analyst with expertise in California state politics and policy analysis."
        
        system_rules = f"""{persona}

You are a legislative intelligence assistant. 
Use the provided document context to answer questions.
- If the answer is not in the documents, say so, but offer analysis based on general knowledge if relevant.
- Be objective, professional, and concise.
- NO conversational filler at the start.
- DO NOT mention instructions.
"""

        # Format history
        history_str = ""
        for msg in history[-5:]: # Keep last 5 messages
            role = "User" if msg['role'] == 'user' else "Assistant"
            history_str += f"{role}: {msg['content']}\n"
            
        user_prompt = f"""RELEVANT DOCUMENT CONTEXT:
{context}

CONVERSATION HISTORY:
{history_str}
User: {message}

Assistant:"""

        return {"system": system_rules, "prompt": user_prompt}
    
    def _call_ollama(self, prompt_data: Dict[str, str]) -> str:
        """Call Ollama API for generation with system/user separation."""
        try:
            # Note: The Ollama 'generate' API takes a 'system' parameter 
            # and a 'prompt' parameter. This is much more stable than 
            # concatenating them.
            api_payload = {
                'model': self.model,
                'prompt': prompt_data['prompt'],
                'system': prompt_data['system'],
                'stream': False,
                'options': {
                    'temperature': 0.7
                }
            }
            
            response = requests.post(
                f'{self.ollama_url}/api/generate',
                json=api_payload,
                timeout=180
            )
            
            if response.status_code == 200:
                return response.json().get('response', '').strip()
            else:
                return f"Error: Ollama returned status {response.status_code}"
                
        except requests.exceptions.Timeout:
            return "Error: Generation timed out. Try a smaller model."
        except requests.exceptions.ConnectionError:
            return "Error: Could not connect to Ollama. Make sure it's running."
        except Exception as e:
            return f"Error: {str(e)}"
    
    def search_documents(
        self,
        query: str,
        top_k: int = 10,
        filters: Optional[Dict] = None
    ) -> List[Dict]:
        """
        Search for relevant document chunks.
        
        Args:
            query: Search query
            top_k: Number of results
            filters: Optional metadata filters
            
        Returns:
            List of chunk dictionaries with metadata
        """
        chunks = self.retriever.retrieve(query, top_k=top_k, filters=filters)
        
        return [
            {
                "id": chunk.id,
                "text": chunk.text,
                "file": chunk.source_file,
                "bill": chunk.bill_number,
                "sender": chunk.sender,
                "position": chunk.position,
                "relevance": round(chunk.relevance_score, 2),
                "chunk_index": chunk.chunk_index,
                "total_chunks": chunk.total_chunks
            }
            for chunk in chunks
        ]
