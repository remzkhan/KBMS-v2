import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

// --- Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyBQJ7g2uIMo9PqQkRTqEk4pfdiKlzAlU4o",
    authDomain: "knowledgebase-manager.firebaseapp.com",
    projectId: "knowledgebase-manager",
    storageBucket: "knowledgebase-manager.appspot.com",
    messagingSenderId: "354377835912",
    appId: "1:354377835912:web:472455a97133208440863d"
};
const geminiApiKey = "YOUR_GEMINI_API_KEY"; // <-- PASTE YOUR GEMINI API KEY HERE
const BACKEND_URL = "http://localhost:3001";
const appId = 'knowledgebase-saas-local-dev';

// --- Initialization ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- Art Component ---
const EmptyStateArt = () => (
    <svg width="100%" height="100%" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor: '#f59e0b', stopOpacity: 1}} />
                <stop offset="100%" style={{stopColor: '#d97706', stopOpacity: 1}} />
            </linearGradient>
        </defs>
        {/* Abstract background shapes */}
        <path d="M 50 300 Q 150 200 250 250 T 450 50" stroke="#374151" fill="transparent" strokeWidth="1" strokeDasharray="5,5"/>
        <path d="M 0 150 Q 100 50 200 100 T 400 200" stroke="#374151" fill="transparent" strokeWidth="1" strokeDasharray="5,5"/>

        {/* Central glowing orb */}
        <circle cx="200" cy="150" r="40" fill="url(#grad1)" filter="url(#glow)" />
        <circle cx="200" cy="150" r="35" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
        
        {/* Orbiting data points */}
        <circle cx="200" cy="150" r="70" stroke="#4b5563" strokeWidth="0.5" fill="none" />
        <circle cx="270" cy="150" r="5" fill="#f59e0b" />
        <circle cx="130" cy="150" r="3" fill="#d97706" />

        <circle cx="200" cy="150" r="110" stroke="#4b5563" strokeWidth="0.5" fill="none" strokeDasharray="2,2"/>
        <circle cx="200" cy="40" r="6" fill="#f59e0b" />
        <circle cx="90" cy="150" r="4" fill="#d97706" />
        <circle cx="310" cy="150" r="4" fill="#d97706" />
        <circle cx="200" cy="260" r="2" fill="#f59e0b" />
    </svg>
);


// --- Reusable Modal Component ---
const Modal = ({ children, onClose }) => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300" onClick={onClose}>
        <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-8 w-full max-w-lg text-gray-200 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            {children}
        </div>
    </div>
);

// --- Jira Integration Modal ---
const JiraConnectModal = ({ onClose, onFetch, setIsLoading, setError }) => {
    const [jiraDomain, setJiraDomain] = useState('');
    const [jiraEmail, setJiraEmail] = useState('');
    const [jiraApiToken, setJiraApiToken] = useState('');
    const [jqlQuery, setJqlQuery] = useState('status = Done AND resolutiondate >= -30d');
    const [isConnecting, setIsConnecting] = useState(false);

    const handleFetch = async () => { setIsConnecting(true); setError(''); try { await onFetch({ domain: jiraDomain, email: jiraEmail, token: jiraApiToken, jqlQuery }); } catch (e) { setError(e.message); } finally { setIsConnecting(false); } };

    return (
        <Modal onClose={onClose}>
            <h2 className="text-2xl font-bold text-white mb-2">Connect to Jira</h2><p className="text-gray-400 mb-6">Fetch ticket data based on a JQL query.</p>
            <div className="space-y-4">
                <input type="text" placeholder="your-company.atlassian.net" value={jiraDomain} onChange={(e) => setJiraDomain(e.target.value)} className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"/>
                <input type="email" placeholder="you@example.com" value={jiraEmail} onChange={(e) => setJiraEmail(e.target.value)} className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"/>
                <input type="password" placeholder="Your Jira API Token" value={jiraApiToken} onChange={(e) => setJiraApiToken(e.target.value)} className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"/>
                <input type="text" value={jqlQuery} onChange={(e) => setJqlQuery(e.target.value)} className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"/>
            </div>
            <div className="mt-8 flex justify-end gap-3"><button onClick={onClose} disabled={isConnecting} className="px-5 py-2 text-sm font-semibold text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all duration-300 disabled:opacity-50">Cancel</button><button onClick={handleFetch} disabled={!jiraDomain || !jiraEmail || !jiraApiToken || isConnecting} className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg disabled:bg-amber-800 disabled:cursor-not-allowed transition-all duration-300">{isConnecting ? 'Connecting...' : 'Connect and Fetch'}</button></div>
        </Modal>
    );
};

// --- Zendesk Integration Modal ---
const ZendeskConnectModal = ({ onClose, onFetch, setIsLoading, setError }) => {
    const [subdomain, setSubdomain] = useState('');
    const [email, setEmail] = useState('');
    const [apiToken, setApiToken] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);

    const handleFetch = async () => { setIsConnecting(true); setError(''); try { await onFetch({ subdomain, email, token: apiToken }); } catch (e) { setError(e.message); } finally { setIsConnecting(false); } };
    
    return (
        <Modal onClose={onClose}>
            <h2 className="text-2xl font-bold text-white mb-2">Connect to Zendesk</h2><p className="text-gray-400 mb-6">Enter your Zendesk details to fetch solved tickets.</p>
            <div className="space-y-4">
                <div className="flex items-center"><input type="text" placeholder="your-company" value={subdomain} onChange={(e) => setSubdomain(e.target.value)} className="w-full p-3 bg-gray-800 border border-gray-600 rounded-l-lg focus:ring-2 focus:ring-amber-500 z-10 outline-none"/><span className="inline-flex items-center px-3 text-gray-400 bg-gray-900 border border-l-0 border-gray-600 rounded-r-md h-[46px]">.zendesk.com</span></div>
                <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"/>
                <input type="password" placeholder="Your Zendesk API Token" value={apiToken} onChange={(e) => setApiToken(e.target.value)} className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"/>
            </div>
            <div className="mt-8 flex justify-end gap-3"><button onClick={onClose} disabled={isConnecting} className="px-5 py-2 text-sm font-semibold text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all duration-300 disabled:opacity-50">Cancel</button><button onClick={handleFetch} disabled={!subdomain || !email || !apiToken || isConnecting} className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg disabled:bg-amber-800 disabled:cursor-not-allowed transition-all duration-300">{isConnecting ? 'Connecting...' : 'Connect and Fetch'}</button></div>
        </Modal>
    );
};

// --- Main Application Component ---
export default function App() {
    const [user, setUser] = useState(null);
    const [articles, setArticles] = useState([]);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [sourceText, setSourceText] = useState('');
    const [sourceUrl, setSourceUrl] = useState('');
    const [inputType, setInputType] = useState('text');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [modal, setModal] = useState(null);

    useEffect(() => { onAuthStateChanged(auth, async (u) => { if (u) setUser(u); else { try { await signInAnonymously(auth); } catch (e) { setError("Auth failed."); }} setIsAuthReady(true); }); }, []);
    useEffect(() => { if (!isAuthReady || !user) return; const q = collection(db, `artifacts/${appId}/users/${user.uid}/knowledgebase`); const unsub = onSnapshot(q, (snap) => { setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))); }); return unsub; }, [isAuthReady, user]);

    const generateArticleFromText = async (text, source) => {
        if (!text) { setError("Content is empty."); setIsLoading(false); return; }
        if (!geminiApiKey || geminiApiKey === "YOUR_GEMINI_API_KEY") { setError("Gemini API Key is not set."); setIsLoading(false); return; }
        const prompt = `Analyze the following content and transform it into a structured knowledge base article. Content: "${text}". Response must be a valid JSON object with schema: { "title": "...", "summary": "...", "content": [ { "heading": "...", "points": ["..."] } ], "keywords": ["..."] }`;
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } }) });
            if (!response.ok) throw new Error(`AI API failed: ${response.status}`);
            const result = await response.json();
            const newArticle = JSON.parse(result.candidates[0].content.parts[0].text);
            await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/knowledgebase`), { ...newArticle, source: source || { type: 'text' }, createdAt: new Date().toISOString() });
            setSourceText(''); setSourceUrl('');
        } catch (err) { setError(`Failed to generate article: ${err.message}`); } finally { setIsLoading(false); }
    };
    
    const fetchFromBackend = async (endpoint, body, source) => { setIsLoading(true); setError(''); setModal(null); try { const res = await fetch(`${BACKEND_URL}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); if (!res.ok) { const err = await res.json(); throw new Error(err.error || `Request failed with status ${res.status}`); } const data = await res.json(); await generateArticleFromText(data.content, source); } catch (err) { setError(`Failed to fetch from source: ${err.message}`); setIsLoading(false); } };
    const handleGenerateClick = () => { setIsLoading(true); if (inputType === 'text') generateArticleFromText(sourceText, { type: 'text' }); else if (inputType === 'url') fetchFromBackend('/api/scrape-url', { url: sourceUrl }, { type: 'url', value: sourceUrl }); };
    
    return (
        <div className="main-bg min-h-screen font-sans text-gray-200">
            {modal === 'jira' && <JiraConnectModal onClose={() => setModal(null)} onFetch={(creds) => fetchFromBackend('/api/fetch-jira', creds, {type: 'jira', value: creds.domain})} setIsLoading={setIsLoading} setError={setError} />}
            {modal === 'zendesk' && <ZendeskConnectModal onClose={() => setModal(null)} onFetch={(creds) => fetchFromBackend('/api/fetch-zendesk', creds, {type: 'zendesk', value: `${creds.subdomain}.zendesk.com`})} setIsLoading={setIsLoading} setError={setError} />}

            <div className="container mx-auto p-4 md:p-8">
                <header className="mb-10 text-center">
                    <h1 className="text-5xl font-bold text-white">Knowledge<span className="text-amber-500">Base</span> AI</h1>
                    <p className="text-gray-400 mt-3">Transform raw data into structured knowledge, instantly.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 flex flex-col gap-8">
                        <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
                            <h2 className="text-2xl font-semibold mb-4 text-white">Create New Article</h2>
                            <div className="grid grid-cols-2 gap-2 mb-4 bg-gray-900 p-1 rounded-lg">
                                <button onClick={() => setInputType('text')} className={`py-2 text-sm font-semibold rounded-md transition-all ${inputType === 'text' ? 'bg-amber-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>Paste Text</button>
                                <button onClick={() => setInputType('url')} className={`py-2 text-sm font-semibold rounded-md transition-all ${inputType === 'url' ? 'bg-amber-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>From URL</button>
                            </div>
                            {inputType === 'text' && <textarea value={sourceText} onChange={(e) => setSourceText(e.target.value)} placeholder="Paste content here..." className="w-full h-40 p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none resize-none" disabled={isLoading}/>}
                            {inputType === 'url' && <input type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://example.com/article" className="w-full h-12 p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" disabled={isLoading}/>}
                            <button onClick={handleGenerateClick} disabled={(!sourceText && inputType==='text') || (!sourceUrl && inputType==='url') || isLoading} className="mt-4 w-full bg-amber-600 text-white font-bold py-3 rounded-lg hover:bg-amber-500 disabled:bg-amber-800/50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center">{isLoading ? 'Processing...' : 'Generate Article'}</button>
                            <div className="mt-6"><p className="text-xs text-center text-gray-500 mb-3 tracking-wider">OR CONNECT A SERVICE</p>
                                <div className="grid grid-cols-3 gap-3">
                                    <button onClick={() => setModal('jira')} className="bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white text-sm py-2 rounded-lg font-semibold transition-all">Jira</button>
                                    <button onClick={() => setModal('zendesk')} className="bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white text-sm py-2 rounded-lg font-semibold transition-all">Zendesk</button>
                                    <button disabled className="bg-gray-800/50 text-gray-600 text-sm py-2 rounded-lg cursor-not-allowed">Slack</button>
                                </div>
                            </div>
                            {error && <p className="text-red-400 text-sm mt-4 p-3 bg-red-900/50 border border-red-500/30 rounded-lg">{error}</p>}
                        </div>
                        <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
                            <h2 className="text-2xl font-semibold mb-4 text-white">Knowledge Base</h2>
                            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                                {articles.length > 0 ? articles.map(article => ( <div key={article.id} onClick={() => setSelectedArticle(article)} className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${selectedArticle?.id === article.id ? 'bg-amber-500/10 border-l-4 border-amber-500' : 'hover:bg-gray-700/50'}`}><h3 className="font-semibold text-white truncate">{article.title}</h3><p className="text-sm text-gray-400 truncate">{article.summary}</p></div> )) : <p className="text-gray-500 text-center py-8">No articles yet.</p>}
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                        <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-8 sticky top-8 min-h-[85vh] backdrop-blur-sm flex items-center justify-center">
                            {selectedArticle ? ( 
                                <div className="animate-fade-in w-full h-full">
                                    <h1 className="text-3xl font-bold text-white mb-2">{selectedArticle.title}</h1><p className="text-amber-400 italic mb-6">{selectedArticle.summary}</p>
                                    {selectedArticle.content?.map((s, i) => ( <div key={i} className="mb-6"><h2 className="text-xl font-semibold text-white mb-3">{s.heading}</h2><ul className="list-disc list-inside space-y-2 text-gray-300">{s.points?.map((p, pi) => <li key={pi}>{p}</li>)}</ul></div> ))}
                                    <div className="mt-8 pt-4 border-t border-gray-700"><h3 className="text-lg font-semibold text-white mb-3">Keywords</h3><div className="flex flex-wrap gap-2">{selectedArticle.keywords?.map((k, i) => <span key={i} className="bg-gray-700 text-amber-400 px-3 py-1 rounded-full text-sm font-medium">{k}</span>)}</div></div>
                                    {selectedArticle.source?.value && ( <div className="mt-8 pt-4 border-t border-gray-700 text-sm text-gray-500"><p>Source: {selectedArticle.source.type === 'url' ? <a href={selectedArticle.source.value} target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:underline">{selectedArticle.source.value}</a> : <span>{selectedArticle.source.value}</span>}</p></div> )}
                                </div>
                             ) : ( 
                                <div className="flex flex-col items-center justify-center h-full text-center text-gray-600 w-full max-w-md">
                                    <EmptyStateArt />
                                    <h2 className="text-2xl font-semibold mt-4">Select an article</h2><p className="mt-1 text-gray-500">Choose one from the list to see its details here.</p>
                                </div>
                             )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
