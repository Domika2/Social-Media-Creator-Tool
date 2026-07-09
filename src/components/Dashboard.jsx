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
  Menu,
  X,
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
    text: "Absolute fire tutorial! Saved me hours of debugging standard API hooks.  💎🚀 ",
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
    text: "Absolute fire tutorial! Saved me hours of debugging standard API hooks.  💎🚀 ",
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
  " 🔥 ",
  " ❤️ ",
  " 🙌 ",
  " 🚀 ",
  " 💯 ",
  " ✨ ",
  " 😂 ",
  " 😮 ",
  " 😢 ",
  " 😠 ",
  " 👎 ",
  " 🤔 ",
  " 👀 ",
  " ✅ ",
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

  // State to control mobile responsive sliding menu overlay
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const handleSendEmojiBroadcast = async (targetComment) => {
    const selectedEmoji = selectedEmojis[targetComment.id] || " 🔥 ";
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
      const currentChosenEmoji = selectedEmojis[group.anchorId] || " 🔥 ";
      const isDropdownOpen = activeDropdownId === group.anchorId;
      return (
        <div
          key={group.anchorId}
          className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg relative w-full min-w-0"
        >
          <div className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-2 mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 min-w-0">
              {iconComponent}
              <h3 className="font-semibold text-xs sm:text-sm text-slate-200 tracking-wide uppercase truncate">
                {isActualCluster
                  ? `Grouped ${groupTypeLabel} Stream`
                  : `Isolated ${groupTypeLabel}`}
              </h3>
            </div>
            <span
              className={`text-[10px] sm:text-xs ${themeStyles} border border-current/20 px-2 py-0.5 rounded-md font-bold shrink-0`}
            >
              {group.items.length}{" "}
              {group.items.length > 1 ? "Matching Comments" : "Single Event"}
            </span>
          </div>

          <div className="space-y-3 mb-4 pl-2 border-l-2 border-slate-800 overflow-x-hidden">
            {group.items.map((item) => (
              <div
                key={item.id}
                className="text-xs sm:text-sm text-slate-300 flex flex-wrap items-center gap-x-2 gap-y-1"
              >
                <span className="text-indigo-400 font-medium">
                  @{item.username}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 font-mono lowercase shrink-0">
                  {item.platform}
                </span>
                <span className="text-slate-400 italic break-words w-full sm:w-auto">
                  "{item.textBody}"
                </span>
              </div>
            ))}
          </div>

          {activeTab === "vibes" ? (
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 fill-current" /> Unified
                  Reaction Console
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  Select custom interaction emoji to broadcast.
                </p>
              </div>
              <div className="flex items-center justify-end gap-3 relative w-full sm:w-auto">
                <div className="relative">
                  <button
                    onClick={() =>
                      setActiveDropdownId(
                        isDropdownOpen ? null : group.anchorId,
                      )
                    }
                    disabled={isGroupActioned}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg px-3 py-2 text-sm flex items-center gap-2 text-slate-200 transition h-9 min-w-[70px] justify-center"
                  >
                    <span className="text-base">{currentChosenEmoji}</span>
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute right-0 bottom-full mb-2 bg-slate-900 border border-slate-700 rounded-xl p-1.5 grid grid-cols-5 gap-1 shadow-2xl z-50 w-44 sm:w-52 animate-in fade-in slide-in-from-bottom-2 duration-150">
                      {EMOJI_CATALOG.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            setSelectedEmojis((prev) => ({
                              ...prev,
                              [group.anchorId]: emoji,
                            }));
                            setActiveDropdownId(null);
                          }}
                          className="text-base p-1.5 hover:bg-slate-800 rounded transition active:scale-95 text-center"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleSendEmojiBroadcast(group.rawComment)}
                  disabled={isGroupActioned}
                  className={`w-full sm:w-auto h-9 flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg transition ${
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
                  <span className="whitespace-nowrap">
                    {isGroupActioned
                      ? "Dispatched"
                      : `Broadcast (${group.items.length})`}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            group.hasAiReply && (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-4 w-full">
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
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500 h-20 resize-none mb-3 block box-border"
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => handleSendReply(group.items[0])}
                    disabled={isGroupActioned}
                    className={`w-full sm:w-auto h-9 flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2 rounded transition ${
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans overflow-x-hidden antialiased">
      {/* BACKGROUND OVERLAY SHIELD (Visible only on mobile when menu is active) */}
      <div
        onClick={() => setIsMobileMenuOpen(false)}
        className={`md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ease-in-out ${
          isMobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      {/* MOBILE HEADER HEADLINE (Visible below desktop breakpoint) */}
      <div className="md:hidden w-full bg-slate-900/90 border-b border-slate-800/80 px-4 py-3.5 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md shadow-md">
        <div className="flex items-center gap-2">
          <Sparkles className="text-indigo-400 w-5 h-5 animate-pulse" />
          <span className="font-bold text-base tracking-wider bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            SynaxixA
          </span>
        </div>

        {/* Toggle Hamburger Trigger */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-slate-400 hover:text-white bg-slate-800/60 rounded-xl transition-colors"
          aria-label="Open sidebar panel navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* RESPONSIVE LEFT SIDEPANEL DRAWER (Slides over gracefully on mobile, docks on desktop) */}
      <aside
        className={`
        fixed inset-y-0 left-0 w-72 bg-slate-900 p-6 flex flex-col justify-between border-r border-slate-800 z-50 
        transition-transform duration-300 ease-in-out transform will-change-transform shadow-2xl shadow-black/80
        md:sticky md:top-0 md:h-screen md:w-64 md:translate-x-0 md:shadow-none
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Sparkles className="text-indigo-400 w-6 h-6 animate-pulse" />
              <span className="font-bold text-lg tracking-wider bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                Creator's Studio
              </span>
            </div>
            {/* Close cross panel button for small mobile resolution metrics */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Close sidebar panel navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-600 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/20 hover:bg-indigo-500"
          >
            <MessageSquare className="w-5 h-5" /> Comment Nexus
          </button>
        </div>
        <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 font-mono tracking-wide">
          SYSTEM LEVEL ACTIVE
        </div>
      </aside>

      {/* RIGHT SIDE DATA FEED WORKSPACE */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 w-full max-w-full box-border overflow-y-auto">
        <header className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 break-words">
            Social-Media-Creator-Tool
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 leading-relaxed">
            Cross-Platform Nexus Engine: Handling YouTube, Instagram, TikTok,
            Twitter & Facebook
          </p>
        </header>

        {/* Swipeable Tab Carousel Container Row */}
        <div className="w-full overflow-x-auto pb-3 mb-6 scrollbar-none snap-x">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 w-max min-w-full sm:min-w-0 sm:w-full max-w-xl gap-1">
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
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 sm:px-3.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-slate-800 text-white border border-slate-700 shadow-lg"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${tab.color}`} />{" "}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FEED SECTIONS STREAM */}
        <section className="w-full max-w-3xl mx-auto space-y-4">
          {loading ? (
            <div className="text-center py-12 text-slate-500 text-xs sm:text-sm animate-pulse">
              Connecting backend database context...
            </div>
          ) : filteredComments.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs sm:text-sm">
              No active events found. All caught up!
            </div>
          ) : activeTab === "urgent" ? (
            renderGroupedTextClusters(
              filteredComments,
              "bg-rose-500/10 text-rose-400 border-rose-500/20",
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
              "Urgent Critical Action",
            )
          ) : activeTab === "faq" ? (
            renderGroupedTextClusters(
              filteredComments,
              "bg-amber-500/10 text-amber-400 border-amber-500/20",
              <Layers className="w-4 h-4 text-amber-400 shrink-0" />,
              "FAQ Inquiry",
            )
          ) : activeTab === "vibes" ? (
            renderGroupedTextClusters(
              filteredComments,
              "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
              <Heart className="w-4 h-4 text-emerald-400 shrink-0" />,
              "Engagement Vibe",
            )
          ) : (
            filteredComments.map((comment) => {
              const isGroupActioned = actionedComments[comment.id];
              return (
                <div
                  key={comment.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-md flex flex-col gap-3 w-full min-w-0"
                >
                  <div className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-2 pb-2 border-b border-slate-800/60">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold text-xs sm:text-sm text-indigo-300 truncate">
                        @{comment.username}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 font-mono lowercase shrink-0">
                        {comment.platform}
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-200 text-xs sm:text-sm italic break-words leading-relaxed">
                    "{comment.text}"
                  </p>

                  {comment.hasAiReply && (
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-3 w-full">
                      <textarea
                        value={customReplies[comment.id] || ""}
                        onChange={(e) =>
                          setCustomReplies((prev) => ({
                            ...prev,
                            [comment.id]: e.target.value,
                          }))
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none h-16 resize-none block box-border"
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleSendReply(comment)}
                          disabled={isGroupActioned}
                          className="w-full sm:w-auto h-8 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded transition flex items-center justify-center"
                        >
                          Send Reply
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
}
