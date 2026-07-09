import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  AlertCircle,
  Layers,
  Heart,
  Sparkles,
  Send,
  Check,
} from "lucide-react";
import { supabase } from "../supabaseClient.js";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("all");
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionedComments, setActionedComments] = useState({});
  const [vibesActioned, setVibesActioned] = useState(false);

  // 1. Fetch live stream data from Supabase on component load
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("comments_streams")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Map database snake_case structure to frontend layout variables safely
        const formattedData = data.map((c) => ({
          id: c.id,
          platform: c.platform,
          username: c.username,
          text: c.text,
          aiCategory: c.ai_category,
          clusterId: c.cluster_id,
          clusterName: c.cluster_name,
          hasAiReply: c.has_ai_reply,
          suggestedReply: c.suggested_reply,
        }));

        setComments(formattedData);
      } catch (err) {
        console.error("Error fetching data layer:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, []);

  // 2. Core filter logic
  const filteredComments = comments.filter((comment) => {
    if (activeTab === "all") return true;
    return comment.aiCategory === activeTab;
  });

  // Handle single AI reply approval
  const handleSendReply = (id) => {
    setActionedComments((prev) => ({ ...prev, [id]: true }));
  };

  // Render a clean loading screen during initialization
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center text-sm font-medium tracking-wide">
        <Sparkles className="w-5 h-5 text-indigo-400 animate-spin mr-2" />
        Connecting to Live Stream Database...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-8">
            <Sparkles className="text-indigo-400 w-6 h-6 animate-pulse" />
            <span className="font-bold text-lg tracking-wider bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Creator Studio
            </span>
          </div>

          <nav className="space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-indigo-600 text-white font-medium transition">
              <MessageSquare className="w-5 h-5" />
              Comment Nexus
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3 border-t border-slate-800 pt-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center font-bold text-sm">
            OD
          </div>
          <div>
            <p className="text-sm font-medium">Dominion C.</p>
            <p className="text-xs text-slate-400">Premium Creator</p>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Social-Media-Creator-Tool
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Active Stream:{" "}
              <span className="text-indigo-400 font-semibold">
                "Building a Startup MVP in 3 Days" (Live Engine)
              </span>
            </p>
          </div>
          <button className="bg-slate-800 hover:bg-slate-700 text-sm px-4 py-2 rounded-lg border border-slate-700 transition">
            Switch Post
          </button>
        </header>

        {/* Smart Tabs Selector */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 max-w-xl mb-8">
          {[
            {
              id: "all",
              label: "All Feed",
              icon: MessageSquare,
              color: "text-slate-400",
            },
            {
              id: "urgent",
              label: "Urgent Action",
              icon: AlertCircle,
              color: "text-rose-400",
            },
            {
              id: "faq",
              label: "FAQ Clusters",
              icon: Layers,
              color: "text-amber-400",
            },
            {
              id: "vibes",
              label: "Pure Vibes",
              icon: Heart,
              color: "text-emerald-400",
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition duration-200 ${
                  isActive
                    ? "bg-slate-800 text-white border border-slate-700 shadow-lg"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                }`}
              >
                <Icon className={`w-4 h-4 ${tab.color}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* DYNAMIC FEED CONTAINER */}
        <section className="max-w-4xl space-y-4">
          {filteredComments.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl text-slate-500">
              No comments here. All caught up!
            </div>
          ) : activeTab === "faq" ? (
            /* --- FAQ CLUSTER MAP --- */
            Object.values(
              filteredComments.reduce((acc, comment) => {
                const key = comment.clusterId || "unclustered";
                if (!acc[key]) {
                  acc[key] = {
                    name: comment.clusterName || "General Questions",
                    items: [],
                  };
                }
                acc[key].items.push(comment);
                return acc;
              }, {}),
            ).map((cluster, index) => (
              <div
                key={index}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg"
              >
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <h3 className="font-semibold text-base text-slate-200">
                      {cluster.name}
                    </h3>
                  </div>
                  <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md font-bold">
                    {cluster.items.length} Similar Comments
                  </span>
                </div>

                <div className="space-y-3 pl-2 border-l-2 border-slate-800">
                  {cluster.items.map((item) => (
                    <div key={item.id} className="text-sm">
                      <span className="text-indigo-400 font-medium">
                        @{item.username}
                      </span>{" "}
                      <span className="text-slate-400">({item.platform}):</span>{" "}
                      <span className="text-slate-300 italic">
                        "{item.text}"
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800 flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Type one reply to answer this entire cluster..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
                  />
                  <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-1.5 shadow">
                    <Send className="w-3.5 h-3.5" /> Broadcast Reply
                  </button>
                </div>
              </div>
            ))
          ) : activeTab === "vibes" ? (
            /* --- PURE VIBES MASS ENGINE MAP --- */
            <div className="space-y-4">
              {!vibesActioned ? (
                <div className="bg-gradient-to-r from-indigo-950 to-slate-900 border border-indigo-500/30 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
                  <div>
                    <h3 className="font-bold text-lg text-indigo-300 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                      AI Vibe Batching Engine
                    </h3>
                    <p className="text-sm text-slate-400 mt-1 max-w-xl">
                      Our system isolated{" "}
                      <span className="text-white font-semibold">
                        {filteredComments.length} positive engagement comments
                      </span>
                      . You can like them all and drop randomized friendly
                      emojis in one action.
                    </p>
                  </div>
                  <button
                    onClick={() => setVibesActioned(true)}
                    className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition"
                  >
                    <Sparkles className="w-4 h-4" /> Auto-Like & Acknowledge All
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                  <Check className="w-4 h-4" /> Successfully liked and
                  distributed appreciation tags to all positive commenters!
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredComments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex justify-between items-center"
                  >
                    <div>
                      <span className="text-xs text-indigo-400 block mb-1">
                        @{comment.username}
                      </span>
                      <p className="text-slate-300 text-sm italic">
                        "{comment.text}"
                      </p>
                    </div>
                    <Heart
                      className={`w-4 h-4 shrink-0 ml-2 ${vibesActioned ? "text-rose-500 fill-rose-500 scale-125 transition duration-300" : "text-slate-600"}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* --- STANDARD SINGLE COMMENT CARD --- */
            filteredComments.map((comment) => (
              <div
                key={comment.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-indigo-300">
                      @{comment.username}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 uppercase">
                      {comment.platform}
                    </span>
                  </div>

                  {comment.aiCategory === "urgent" && (
                    <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <AlertCircle className="w-3.5 h-3.5" /> Action Required
                    </span>
                  )}
                </div>

                <p className="text-slate-200 text-sm md:text-base leading-relaxed">
                  {comment.text}
                </p>

                {comment.hasAiReply && (
                  <div className="mt-4 bg-slate-950 border border-slate-800 rounded-lg p-4">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-purple-400 mb-2">
                      <Sparkles className="w-3.5 h-3.5" /> Suggested AI Draft
                      Response
                    </div>
                    <p className="text-slate-300 text-sm italic">
                      "{comment.suggestedReply}"
                    </p>
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => handleSendReply(comment.id)}
                        disabled={actionedComments[comment.id]}
                        className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded transition ${
                          actionedComments[comment.id]
                            ? "bg-emerald-500/25 text-emerald-400 cursor-default"
                            : "bg-indigo-600 hover:bg-indigo-500 text-white"
                        }`}
                      >
                        {actionedComments[comment.id] ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Sent to Platform
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" /> Approve & Send
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
