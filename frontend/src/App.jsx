import React, { useState } from "react";
import { ShieldCheck, ShieldAlert, Search, Activity, Users, UserPlus, FileText, Cpu, CheckCircle, XCircle } from "lucide-react";
import NetworkGraph from "./NetworkGraph";
import "./App.css";

export default function App() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("https://instagram-bot-detection.onrender.com/api/v1/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_username: username.trim() }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.detail || "Failed to analyze target account.");
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout">
      {/* BRAND NAME UPDATED HERE */}
      <header className="brand-header">
        <div className="brand-title">
          <Activity size={22} className="brand-icon" />
          <h2>Bot<span>Lens</span></h2>
        </div>
        <p className="brand-subtitle">AI-Powered Social Network Forensics</p>
      </header>

      <form onSubmit={handleAnalyze} className="search-container">
        <div className="search-input-box">
          <Search size={17} className="search-icon" />
          <input
            type="text"
            placeholder="Enter username (e.g. cristiano)..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Scanning..." : "Analyze"}
          </button>
        </div>
      </form>

      {error && <div className="error-alert">{error}</div>}

      {data && (
        <div className="results-container">
          {/* UPDATED VERDICT BANNER WITH LARGE AVATAR */}
          <div className={`verdict-box ${data.prediction.is_bot ? "bot" : "real"}`}>
            <div className="verdict-left">
              {data.features.has_profile_pic === 1 && data.profile_pic_url ? (
                <div className="header-avatar-wrapper">
                  <img 
                    src={data.profile_pic_url} 
                    alt="Target Profile" 
                    className="header-avatar" 
                    referrerPolicy="no-referrer" 
                  />
                  <div className="shield-badge">
                    {data.prediction.is_bot ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
                  </div>
                </div>
              ) : (
                data.prediction.is_bot ? <ShieldAlert size={36} /> : <ShieldCheck size={36} />
              )}
              <div className="verdict-titles">
                <h3>{data.prediction.verdict}</h3>
                <span className="target-handle">@{data.target}</span>
              </div>
            </div>
            <div className="verdict-metrics">
              <div>Confidence: <strong>{data.prediction.confidence_score}%</strong></div>
              <div>Bot Risk: <strong>{(data.prediction.bot_probability * 100).toFixed(1)}%</strong></div>
            </div>
          </div>

          <div className="dashboard-card audit-box">
            <div className="card-header">
              <Cpu size={17} className="card-icon" />
              <h4>AI Security Audit</h4>
            </div>
            <p className="audit-content">{data.audit_report}</p>
          </div>

          {/* UPDATED METRICS ROW (Removed tiny image) */}
          <div className="metrics-row">
            <div className="metric-card">
              <Users size={16} />
              <span className="metric-label">Followers</span>
              <span className="metric-val">{data.features.follower_count?.toLocaleString()}</span>
            </div>
            <div className="metric-card">
              <UserPlus size={16} />
              <span className="metric-label">Following</span>
              <span className="metric-val">{data.features.following_count?.toLocaleString()}</span>
            </div>
            <div className="metric-card">
              <FileText size={16} />
              <span className="metric-label">Bio Length</span>
              <span className="metric-val">{data.features.bio_length} chars</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Profile Picture</span>
              <div className="avatar-status">
                {data.features.has_profile_pic === 1 ? (
                  <><CheckCircle size={17} color="#10b981" /> Active</>
                ) : (
                  <><XCircle size={17} color="#ef4444" /> Missing</>
                )}
              </div>
            </div>
          </div>

          <div className="dashboard-card graph-box">
            <div className="card-header">
              <Activity size={17} className="card-icon" />
              <h4>Follower Topology ({data.network.sampled_followers.length} Sampled Nodes)</h4>
            </div>
            <NetworkGraph
              target={data.target}
              followers={data.network.sampled_followers}
              isBot={data.prediction.is_bot}
            />
          </div>
        </div>
      )}
    </div>
  );
}