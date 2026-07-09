import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  AlertCircle,
  Layers,
  Heart,
  Sparkles,
  Send,
  Check,
  ChevronDown,
} from "lucide-react";
import { supabase } from "../supabaseClient";

const MOCK_TRAFFIC_POOL = [
  {
    platform: "facebook",
    username: "john_meta",
    text: "Where can I download the project source code? The link in the bio throws a 404 error.",
    ai_category: "urgent",
  },
  {
    platform: "youtube",
    username: "dev_chinedu",
    text: "Where can I download the project source code? The link in the bio throws a 404 error.",
    ai_category: "urgent",
  },
  {
    platform: "tiktok",
    username: "fola_designs",
    text: "Absolute fire tutorial! Saved me hours of debugging standard API hooks. 💎🚀",
    ai_category: "vibes",
  },
  {
    platform: "instagram",
    username: "blessing_codes",
    text: "This UI is super clean! What layout system did you use for the grids?",
    ai_category: "faq",
  },
  {
    platform: "facebook",
    username: "grace_f",
    text: "This UI is super clean! What layout system did you use for the grids?",
    ai_category: "faq",
  },
  {
    platform: "twitter",
    username: "samuel_dev",
    text: "Absolute fire tutorial! Saved me hours of debugging standard API hooks. 💎🚀",
    ai_category: "vibes",
  },
  {
    platform: "facebook",
    username: "hater_dan",
    text: "This code layout is messy. It looks super unoptimized.",
    ai_category: "vibes",
  },
  {
    platform: "youtube",
    username: "toxic_coder",
    text: "This code layout is messy. It looks super unoptimized.",
    ai_category: "vibes",
  },
];

// Complete emoji set catalog across all expressive moods
const EMOJI_CATALOG = [
  "🔥",
  "❤️",
  "🙌",
  "🚀",
  "💯",
  "✨",
  "😂",
  "😮",
  "😢",
  "😠",
  "👎",
  "🤔",
  "👀",
  "✅",
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("all");
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionedComments, setActionedComments] = useState({});
  const [customReplies, setCustomReplies] = useState({});

  // Track open dropdowns per cluster node card in memory
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  // Track selected emoji state token per specific cluster item anchor
  const [selectedEmojis, setSelectedEmojis] = useState({});

  const mapCommentData = (c) => ({
    id: c.id,
    platform: c.platform,
    username: c.username,
    text: c.text,
    aiCategory: c.ai_category,
    hasAiReply: c.ai_category === "urgent" || c.ai_category === "faq",
    suggestedReply:
      c.suggested_reply ||
      `Hey, checking our context regarding: "${c.text.substring(0, 20)}..." right now!`,
  });

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("comment_streams")
          .select("*")
          .neq("ai_category", "archived")
          .order("created_at", { ascending: false });

        if (error) throw error;

        const frontendData = data.map(mapCommentData);
        setComments(frontendData);

        const initialReplies = {};
        frontendData.forEach((item) => {
          initialReplies[item.id] = item.suggestedReply;
        });
        setCustomReplies(initialReplies);
      } catch (err) {
        console.error("Error fetching baseline stream:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();

    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comment_streams" },
        (payload) => {
          const newComment = mapCommentData(payload.new);
          setComments((prev) => [newComment, ...prev]);
          setCustomReplies((prev) => ({
            ...prev,
            [newComment.id]: newComment.suggestedReply,
          }));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const simulateIncomingTraffic = async () => {
      const randomItem =
        MOCK_TRAFFIC_POOL[Math.floor(Math.random() * MOCK_TRAFFIC_POOL.length)];

      const newCommentRow = {
        id: `sim_${Math.random().toString(36).substr(2, 9)}`,
        platform: randomItem.platform,
        username: randomItem.username,
        text: randomItem.text,
        ai_category: randomItem.ai_category,
        suggested_reply: `Hi @${randomItem.username}! Tracking this immediately.`,
      };

      const { error } = await supabase
        .from("comment_streams")
        .insert([newCommentRow]);
      if (error) console.error("Traffic ingestion failed:", error.message);
    };

    const trafficInterval = setInterval(simulateIncomingTraffic, 15000);
    return () => clearInterval(trafficInterval);
  }, []);

  const filteredComments = comments.filter((comment) => {
    if (activeTab === "all") return true;
    return comment.aiCategory === activeTab;
  });

  const handleSendReply = async (targetComment) => {
    const finalReplyMessage =
      customReplies[targetComment.id] || targetComment.suggestedReply;
    const matchingComments = comments.filter(
      (c) =>
        c.text === targetComment.text &&
        c.aiCategory === targetComment.aiCategory,
    );
    const targetsArray = matchingComments.map((c) => c.id);

    try {
      const { error } = await supabase
        .from("comment_streams")
        .update({ ai_category: "archived", suggested_reply: finalReplyMessage })
        .in("id", targetsArray);

      if (error) throw error;

      const statusUpdates = {};
      targetsArray.forEach((id) => {
        statusUpdates[id] = true;
      });
      setActionedComments((prev) => ({ ...prev, ...statusUpdates }));

      setTimeout(() => {
        setComments((prev) =>
          prev.filter((comment) => !targetsArray.includes(comment.id)),
        );
      }, 600);
    } catch (err) {
      console.error("Failed to execute broadcast adjustment:", err.message);
    }
  };

  // REACTION ENGINE: Dispatches the chosen dropdown emoji parameter package down to Supabase
  const handleSendEmojiBroadcast = async (targetComment) => {
    const selectedEmoji = selectedEmojis[targetComment.id] || "🔥";
    const matchingComments = comments.filter(
      (c) => c.text === targetComment.text && c.aiCategory === "vibes",
    );
    const targetsArray = matchingComments.map((c) => c.id);

    try {
      const { error } = await supabase
        .from("comment_streams")
        .update({
          ai_category: "archived",
          suggested_reply: `[Reaction Matrix: ${selectedEmoji}]`,
        })
        .in("id", targetsArray);

      if (error) throw error;

      const statusUpdates = {};
      targetsArray.forEach((id) => {
        statusUpdates[id] = true;
      });
      setActionedComments((prev) => ({ ...prev, ...statusUpdates }));

      setTimeout(() => {
        setComments((prev) =>
          prev.filter((comment) => !targetsArray.includes(comment.id)),
        );
      }, 600);
    } catch (err) {
      console.error(
        "Failed to dispatch reaction adjustment array:",
        err.message,
      );
    }
  };

  const renderGroupedTextClusters = (
    items,
    themeStyles,
    iconComponent,
    groupTypeLabel,
  ) => {
    const textGroups = Object.values(
      items.reduce((acc, comment) => {
        const key = comment.text;
        if (!acc[key]) {
          acc[key] = {
            anchorId: comment.id,
            textBody: comment.text,
            hasAiReply: comment.hasAiReply,
            suggestedReply: comment.suggestedReply,
            rawComment: comment,
            items: [],
          };
        }
        acc[key].items.push(comment);
        return acc;
      }, {}),
    );

    return textGroups.map((group) => {
      const isGroupActioned = actionedComments[group.anchorId];
      const isActualCluster = group.items.length > 1;
      const currentChosenEmoji = selectedEmojis[group.anchorId] || "🔥";
      const isDropdownOpen = activeDropdownId === group.anchorId;

      return (
        <div
          key={group.anchorId}
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative"
        >
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              {iconComponent}
              <h3 className="font-semibold text-sm text-slate-200 tracking-wide uppercase">
                {isActualCluster
                  ? `Grouped ${groupTypeLabel} Stream`
                  : `Isolated ${groupTypeLabel}`}
              </h3>
            </div>
            <span
              className={`text-xs ${themeStyles} border border-current/20 px-2 py-0.5 rounded-md font-bold`}
            >
              {group.items.length}{" "}
              {group.items.length > 1 ? "Matching Comments" : "Single Event"}
            </span>
          </div>

          {/* Group Content Nodes */}
          <div className="space-y-3 mb-4 pl-2 border-l-2 border-slate-800">
            {group.items.map((item) => (
              <div
                key={item.id}
                className="text-sm text-slate-300 flex items-center gap-2"
              >
                <span className="text-indigo-400 font-medium">
                  @{item.username}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono lowercase">
                  {item.platform}
                </span>
                <span className="text-slate-400 italic">"{item.textBody}"</span>
              </div>
            ))}
          </div>

          {/* ACTIONS HUB FOOTER BLOCK */}
          {activeTab === "vibes" ? (
            /* NEW SELECTABLE DROP-DOWN ARCHITECTURE */
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 fill-current" /> Unified
                  Reaction Console
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select your custom interaction emoji parameter to broadcast.
                </p>
              </div>

              <div className="flex items-center gap-3 relative">
                {/* Custom Native Dropdown Button Node */}
                <div className="relative">
                  <button
                    onClick={() =>
                      setActiveDropdownId(
                        isDropdownOpen ? null : group.anchorId,
                      )
                    }
                    disabled={isGroupActioned}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg px-4 py-2.5 text-sm flex items-center gap-2 text-slate-200 transition min-w-[70px] justify-center"
                  >
                    <span className="text-lg">{currentChosenEmoji}</span>
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  </button>

                  {/* Dropdown Menu Overlay Container */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 bottom-full mb-2 bg-slate-900 border border-slate-700 rounded-xl p-2 grid grid-cols-5 gap-1 shadow-2xl z-50 w-52 animate-in fade-in slide-in-from-bottom-2 duration-150">
                      {EMOJI_CATALOG.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            setSelectedEmojis((prev) => ({
                              ...prev,
                              [group.anchorId]: emoji,
                            }));
                            setActiveDropdownId(null); // Close panel menu
                          }}
                          className="text-lg p-1.5 hover:bg-slate-800 rounded transition active:scale-95 text-center"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Broadcast Submission Action Trigger */}
                <button
                  onClick={() => handleSendEmojiBroadcast(group.rawComment)}
                  disabled={isGroupActioned}
                  className={`flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-lg transition ${
                    isGroupActioned
                      ? "bg-emerald-500/25 text-emerald-400"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white"
                  }`}
                >
                  {isGroupActioned ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  {isGroupActioned
                    ? "Dispatched"
                    : `Broadcast (${group.items.length})`}
                </button>
              </div>
            </div>
          ) : (
            /* Text Fields UI for standard tab modules */
            group.hasAiReply && (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                <div className="text-xs font-medium text-indigo-400 mb-2 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Core Response Draft
                  (Editable)
                </div>
                <textarea
                  value={customReplies[group.anchorId] || ""}
                  onChange={(e) =>
                    setCustomReplies((prev) => ({
                      ...prev,
                      [group.anchorId]: e.target.value,
                    }))
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 h-20 resize-none mb-3"
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => handleSendReply(group.items[0])}
                    disabled={isGroupActioned}
                    className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded transition ${
                      isGroupActioned
                        ? "bg-emerald-500/25 text-emerald-400"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white"
                    }`}
                  >
                    {isGroupActioned ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Complete
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" /> Send Reply
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      <aside className="w-64 border-r border-slate-800 bg-slate-900 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-8">
            <Sparkles className="text-indigo-400 w-6 h-6 animate-pulse" />
            <span className="font-bold text-lg tracking-wider bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Creator Studio
            </span>
          </div>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-indigo-600 text-white font-medium">
            <MessageSquare className="w-5 h-5" /> Comment Nexus
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">
            Social-Media-Creator-Tool
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Cross-Platform Nexus Engine: Handling YouTube, Instagram, TikTok,
            Twitter & Facebook
          </p>
        </header>

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
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition ${
                  activeTab === tab.id
                    ? "bg-slate-800 text-white border border-slate-700 shadow-lg"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className={`w-4 h-4 ${tab.color}`} /> {tab.label}
              </button>
            );
          })}
        </div>

        <section className="max-w-4xl space-y-4">
          {filteredComments.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl text-slate-500">
              No active events found. All caught up!
            </div>
          ) : activeTab === "urgent" ? (
            renderGroupedTextClusters(
              filteredComments,
              "bg-rose-500/10 text-rose-400 border-rose-500/20",
              <AlertCircle className="w-4 h-4 text-rose-400" />,
              "Urgent Critical Action",
            )
          ) : activeTab === "faq" ? (
            renderGroupedTextClusters(
              filteredComments,
              "bg-amber-500/10 text-amber-400 border-amber-500/20",
              <Layers className="w-4 h-4 text-amber-400" />,
              "FAQ Inquiry",
            )
          ) : activeTab === "vibes" ? (
            renderGroupedTextClusters(
              filteredComments,
              "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
              <Heart className="w-4 h-4 text-emerald-400" />,
              "Engagement Vibe",
            )
          ) : (
            filteredComments.map((comment) => (
              <div
                key={comment.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-indigo-300">
                      @{comment.username}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono lowercase">
                      {comment.platform}
                    </span>
                  </div>
                </div>
                <p className="text-slate-200 text-sm mb-4">"{comment.text}"</p>
                {comment.hasAiReply && (
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
                    <textarea
                      value={customReplies[comment.id] || ""}
                      onChange={(e) =>
                        setCustomReplies((prev) => ({
                          ...prev,
                          [comment.id]: e.target.value,
                        }))
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none h-16 resize-none"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleSendReply(comment)}
                        className="bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded"
                      >
                        Send Reply
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
