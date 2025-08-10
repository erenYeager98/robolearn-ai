// services/localApi.js
export async function searchLocalLLM(query) {
  const res = await fetch(`http://localhost:5000/local-llm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  if (!res.ok) throw new Error('Local LLM request failed');
  return await res.json(); // should return { response: "...", imageUrl: "..." }
}
