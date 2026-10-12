"use client";

import Link from "next/link";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import {
  canAllocatePayout,
  getIncrementalPayout,
  getTargetPayout,
  type PayoutMilestone,
} from "../lib/payout";

export type Role = "brand" | "creator";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

type Milestone = PayoutMilestone;

interface Campaign {
  _id: string;
  name: string;
  platform: string;
  totalBudget: number;
  spentBudget?: number;
  remainingBudget?: number;
  milestones: Milestone[];
}

interface Submission {
  _id: string;
  campaignId: Campaign | string;
  postUrl: string;
  views: number;
  targetPayout: number;
  paidAmount: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");
async function apiRequest<T>(
  path: string,
  token?: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
        ? body.error
        : `Request failed (${response.status})`;
    throw new Error(message);
  }

  return body as T;
}

function money(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function campaignFromSubmission(submission: Submission): Campaign | undefined {
  return typeof submission.campaignId === "object"
    ? submission.campaignId
    : undefined;
}

export function AuthScreen({
  mode,
  onSuccess,
}: {
  mode: "login" | "signup";
  onSuccess: (session: AuthResponse) => void;
}) {
  const [role, setRole] = useState<Role>("creator");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const session = await apiRequest<AuthResponse>(
        `/auth/${mode === "signup" ? "signup" : "login"}`,
        undefined,
        {
          method: "POST",
          body: JSON.stringify(
            mode === "signup"
              ? { name, email, password, role }
              : { email, password }
          ),
        }
      );
      onSuccess(session);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Unable to sign in"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-layout">
      <section className="auth-aside">
        <Link className="brand-lockup auth-brand" href="/">
          <span className="brand-mark">S</span>
          <span>Meme&apos;d<span className="brand-period">.</span></span>
        </Link>
        <div className="auth-message">
          <p className="eyebrow">GOOD WORK, MEET GOOD PEOPLE</p>
          <h1>Make your next collaboration count.</h1>
          <p>
            A simpler way for brands and creators to build campaigns and grow
            together.
          </p>
        </div>
        <div className="aside-card">
          <span className="aside-card-icon">↗</span>
          <div>
            <strong>Clear goals. Fair rewards.</strong>
            <p>Milestone payouts you can actually keep track of.</p>
          </div>
        </div>
        <span className="auth-decoration decoration-a" />
        <span className="auth-decoration decoration-b" />
      </section>

      <section className="auth-main">
        <div className="auth-form-wrap">
          <div className="auth-heading">
            <p className="eyebrow">{mode === "login" ? "WELCOME BACK" : "GET STARTED"}</p>
            <h2>{mode === "login" ? "Sign in to Meme'd" : "Create your account"}</h2>
            <p>
              {mode === "login"
                ? "Pick up right where you left off."
                : "Join the community and get your next campaign moving."}
            </p>
          </div>

          <div className="auth-tabs" role="tablist" aria-label="Account access">
            <Link
            className={mode === "login" ? "active" : ""}
            href="/login"
            role="tab"
            aria-selected={mode === "login"}
            >
            Sign in
            </Link>
            <Link
            className={mode === "signup" ? "active" : ""}
            href="/signup"
            role="tab"
            aria-selected={mode === "signup"}
            >
            Create account
            </Link>
          </div>

          <form className="form-stack" onSubmit={submit}>
            {mode === "signup" && (
              <>
                <label className="field">
                  <span>Full name</span>
                  <input
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                    required
                    maxLength={100}
                  />
                </label>
                <fieldset className="role-select">
                  <legend>I am here as a</legend>
                  <label className={role === "creator" ? "selected" : ""}>
                    <input
                      type="radio"
                      name="role"
                      value="creator"
                      checked={role === "creator"}
                      onChange={() => setRole("creator")}
                    />
                    <span className="role-icon">✳</span>
                    <span>
                      <strong>Creator</strong>
                      <small>Find campaigns & earn</small>
                    </span>
                  </label>
                  <label className={role === "brand" ? "selected" : ""}>
                    <input
                      type="radio"
                      name="role"
                      value="brand"
                      checked={role === "brand"}
                      onChange={() => setRole("brand")}
                    />
                    <span className="role-icon brand-icon">◈</span>
                    <span>
                      <strong>Brand</strong>
                      <small>Launch a campaign</small>
                    </span>
                  </label>
                </fieldset>
              </>
            )}
            <label className="field">
              <span>Email address</span>
              <input
                autoComplete="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                type="password"
                minLength={mode === "signup" ? 8 : 1}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                required
              />
            </label>
            {error && (
              <div className="notice notice-error" role="alert">
                {error}
              </div>
            )}
            <button className="button button-primary auth-submit" disabled={busy}>
              {busy
                ? "Please wait…"
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
              {!busy && <span aria-hidden="true">→</span>}
            </button>
          </form>
          <p className="auth-switch">
            {mode === "login" ? "New to Meme'd?" : "Already have an account?"}{" "}
            <Link href={mode === "login" ? "/signup" : "/login"}>
              {mode === "login" ? "Create an account" : "Sign in"}
            </Link>
          </p>
        </div>
        <p className="auth-legal">By continuing, you agree to our terms and privacy policy.</p>
      </section>
    </main>
  );
}

export function BrandDashboard({
  token,
  setNotice,
}: {
  token: string;
  setNotice: (notice: string) => void;
}) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [budget, setBudget] = useState("");
  const [milestones, setMilestones] = useState<Milestone[]>([
    { views: 1000, payout: 500 },
    { views: 5000, payout: 2000 },
  ]);

  const loadCampaigns = useCallback(async () => {
    try {
      const result = await apiRequest<{ campaigns: Campaign[] }>(
        "/campaigns/mine",
        token
      );
      setCampaigns(result.campaigns);
      setNotice("");
    } catch (loadError) {
      setNotice(
        loadError instanceof Error
          ? loadError.message
          : "Could not load your campaigns"
      );
    } finally {
      setLoading(false);
    }
  }, [token, setNotice]);

  useEffect(() => {
    let active = true;
    apiRequest<{ campaigns: Campaign[] }>("/campaigns/mine", token)
      .then((result) => {
        if (active) {
          setCampaigns(result.campaigns);
          setNotice("");
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setNotice(
            loadError instanceof Error
              ? loadError.message
              : "Could not load your campaigns"
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [token, setNotice]);

  const spent = campaigns.reduce(
    (total, campaign) => total + (campaign.spentBudget ?? 0),
    0
  );
  const remaining = campaigns.reduce(
    (total, campaign) =>
      total + (campaign.remainingBudget ?? campaign.totalBudget),
    0
  );

  const createCampaign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    const totalBudget = Number(budget);
    const highestPayout = Math.max(
      ...milestones.map((milestone) => Number(milestone.payout))
    );

    if (!canAllocatePayout(totalBudget, 0, highestPayout)) {
      setNotice("Each milestone payout must fit within the campaign budget.");
      setBusy(false);
      return;
    }

    try {
      await apiRequest("/campaigns", token, {
        method: "POST",
        body: JSON.stringify({
          name,
          platform,
          totalBudget,
          milestones: milestones.map((milestone) => ({
            views: Number(milestone.views),
            payout: Number(milestone.payout),
          })),
        }),
      });
      setName("");
      setBudget("");
      await loadCampaigns();
    } catch (createError) {
      setNotice(
        createError instanceof Error
          ? createError.message
          : "Could not create campaign"
      );
    } finally {
      setBusy(false);
    }
  };

  const updateMilestone = (
    index: number,
    key: keyof Milestone,
    value: number
  ) => {
    setMilestones((current) =>
      current.map((milestone, currentIndex) =>
        currentIndex === index ? { ...milestone, [key]: value } : milestone
      )
    );
  };

  return (
    <div className="dashboard-grid">
      <section className="main-column">
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR OVERVIEW</p>
            <h2>Budget at a glance</h2>
          </div>
          <span className="campaign-count">
            {campaigns.length} {campaigns.length === 1 ? "campaign" : "campaigns"}
          </span>
        </div>

        <div className="metric-grid">
          <article className="metric-card">
            <span className="metric-label">Total allocated</span>
            <strong>{money(spent + remaining)}</strong>
            <span className="metric-footnote">Across your campaigns</span>
            <span className="metric-icon lavender">◈</span>
          </article>
          <article className="metric-card">
            <span className="metric-label">Budget spent</span>
            <strong>{money(spent)}</strong>
            <span className="metric-footnote">Payouts actually allocated</span>
            <span className="metric-icon peach">↗</span>
          </article>
          <article className="metric-card">
            <span className="metric-label">Still available</span>
            <strong>{money(remaining)}</strong>
            <span className="metric-footnote">Ready for your creators</span>
            <span className="metric-icon mint">＋</span>
          </article>
        </div>

        <div className="section-heading campaign-list-heading">
          <div>
            <p className="eyebrow">KEEP THE MOMENTUM</p>
            <h2>Your campaigns</h2>
          </div>
        </div>
        {loading ? (
          <div className="empty-card">Loading campaigns…</div>
        ) : campaigns.length === 0 ? (
          <div className="empty-card">
            <span className="empty-icon">◈</span>
            <h3>Your first campaign starts here</h3>
            <p>Create a campaign and set clear milestones for your creators.</p>
          </div>
        ) : (
          <div className="campaign-list">
            {campaigns.map((campaign) => {
              const campaignSpent = campaign.spentBudget ?? 0;
              const campaignRemaining =
                campaign.remainingBudget ?? campaign.totalBudget;
              const progress =
                campaign.totalBudget > 0
                  ? Math.min(100, (campaignSpent / campaign.totalBudget) * 100)
                  : 0;
              return (
                <article className="campaign-card" key={campaign._id}>
                  <div className="campaign-card-top">
                    <div className="campaign-avatar">{campaign.name.charAt(0).toUpperCase()}</div>
                    <div className="campaign-title">
                      <h3>{campaign.name}</h3>
                      <span>{campaign.platform}</span>
                    </div>
                    <span className="status-pill">Live</span>
                  </div>
                  <div className="budget-values">
                    <span>
                      <small>Spent</small>
                      <strong>{money(campaignSpent)}</strong>
                    </span>
                    <span className="budget-remaining">
                      <small>Remaining</small>
                      <strong>{money(campaignRemaining)}</strong>
                    </span>
                    <span className="budget-total">
                      <small>Total</small>
                      <strong>{money(campaign.totalBudget)}</strong>
                    </span>
                  </div>
                  <div
                    className="progress-track"
                    role="progressbar"
                    aria-label={`${campaign.name} budget spent`}
                    aria-valuenow={Math.round(progress)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <span style={{ width: `${progress}%` }} />
                  </div>
                  <p className="milestone-summary">
                    {campaign.milestones.length} payout{" "}
                    {campaign.milestones.length === 1 ? "milestone" : "milestones"} ·
                    {" "}up to {money(campaign.milestones.at(-1)?.payout ?? 0)}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <aside className="side-column">
        <section className="panel create-panel">
          <div className="panel-heading">
            <span className="panel-icon">＋</span>
            <div>
              <p className="eyebrow">NEW OPPORTUNITY</p>
              <h2>Create a campaign</h2>
            </div>
          </div>
          <form className="form-stack compact-form" onSubmit={createCampaign}>
            <label className="field">
              <span>Campaign name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Summer product launch"
                required
                maxLength={120}
              />
            </label>
            <label className="field">
              <span>Platform</span>
              <select
                value={platform}
                onChange={(event) => setPlatform(event.target.value)}
                required
              >
                <option value="instagram">Instagram</option>
                <option value="youtube">YouTube</option>
                <option value="tiktok">TikTok</option>
                <option value="facebook">Facebook</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="field">
              <span>Total budget (₹)</span>
              <input
                type="number"
                min="1"
                step="1"
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
                placeholder="10000"
                required
              />
            </label>
            <div className="milestone-fields">
              <div className="milestone-label">
                <span>View milestones</span>
                {milestones.length < 8 && (
                  <button
                    className="text-button"
                    type="button"
                    onClick={() =>
                      setMilestones((current) => [
                        ...current,
                        {
                          views: (current.at(-1)?.views ?? 0) + 5000,
                          payout: current.at(-1)?.payout ?? 0,
                        },
                      ])
                    }
                  >
                    + Add tier
                  </button>
                )}
              </div>
              {milestones.map((milestone, index) => (
                <div className="milestone-row" key={index}>
                  <label className="field">
                    <span className="sr-only">Views for tier {index + 1}</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      aria-label={`Views for tier ${index + 1}`}
                      value={milestone.views}
                      onChange={(event) =>
                        updateMilestone(index, "views", Number(event.target.value))
                      }
                      required
                    />
                  </label>
                  <label className="field">
                    <span className="sr-only">Payout for tier {index + 1} in rupees</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      aria-label={`Payout for tier ${index + 1} in rupees`}
                      value={milestone.payout}
                      onChange={(event) =>
                        updateMilestone(index, "payout", Number(event.target.value))
                      }
                      required
                    />
                  </label>
                  {milestones.length > 1 && (
                    <button
                      className="remove-tier"
                      type="button"
                      aria-label={`Remove milestone ${index + 1}`}
                      onClick={() =>
                        setMilestones((current) =>
                          current.filter((_, currentIndex) => currentIndex !== index)
                        )
                      }
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <div className="milestone-hints">
                <span>Views</span>
                <span>Payout · ₹</span>
              </div>
            </div>
            <button className="button button-primary full-button" disabled={busy}>
              {busy ? "Creating…" : "Create campaign"}
              {!busy && <span aria-hidden="true">→</span>}
            </button>
          </form>
        </section>
      </aside>
    </div>
  );
}

export function CreatorDashboard({
  token,
  setNotice,
}: {
  token: string;
  setNotice: (notice: string) => void;
}) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [postUrl, setPostUrl] = useState("");
  const [busyCampaign, setBusyCampaign] = useState("");
  const [viewInputs, setViewInputs] = useState<Record<string, string>>({});
  const [busySubmission, setBusySubmission] = useState("");

  const loadCreatorData = useCallback(async () => {
    try {
      const [campaignResult, submissionResult] = await Promise.all([
        apiRequest<{ campaigns: Campaign[] }>("/campaigns", token),
        apiRequest<{ submissions: Submission[]; totalPaidAmount: number }>(
          "/submissions/mine",
          token
        ),
      ]);
      setCampaigns(campaignResult.campaigns);
      setSubmissions(submissionResult.submissions);
      setTotalPaid(submissionResult.totalPaidAmount);
      setNotice("");
    } catch (loadError) {
      setNotice(
        loadError instanceof Error
          ? loadError.message
          : "Could not load creator dashboard"
      );
    } finally {
      setLoading(false);
    }
  }, [token, setNotice]);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiRequest<{ campaigns: Campaign[] }>("/campaigns", token),
      apiRequest<{ submissions: Submission[]; totalPaidAmount: number }>(
        "/submissions/mine",
        token
      ),
    ])
      .then(([campaignResult, submissionResult]) => {
        if (active) {
          setCampaigns(campaignResult.campaigns);
          setSubmissions(submissionResult.submissions);
          setTotalPaid(submissionResult.totalPaidAmount);
          setNotice("");
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setNotice(
            loadError instanceof Error
              ? loadError.message
              : "Could not load creator dashboard"
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [token, setNotice]);

  const submitPost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCampaign) {
      setNotice("Choose a campaign before submitting a post.");
      return;
    }
    setBusyCampaign(selectedCampaign);
    setNotice("");
    try {
      await apiRequest("/submissions", token, {
        method: "POST",
        body: JSON.stringify({
          campaignId: selectedCampaign,
          postUrl,
        }),
      });
      setPostUrl("");
      await loadCreatorData();
    } catch (submitError) {
      setNotice(
        submitError instanceof Error
          ? submitError.message
          : "Could not submit your post"
      );
    } finally {
      setBusyCampaign("");
    }
  };

  const updateViews = async (
    event: FormEvent<HTMLFormElement>,
    submission: Submission
  ) => {
    event.preventDefault();
    const views = Number(viewInputs[submission._id] ?? submission.views);
    setBusySubmission(submission._id);
    setNotice("");
    try {
      await apiRequest(`/submissions/${submission._id}/views`, token, {
        method: "PATCH",
        body: JSON.stringify({ views }),
      });
      await loadCreatorData();
    } catch (updateError) {
      setNotice(
        updateError instanceof Error
          ? updateError.message
          : "Could not update views"
      );
    } finally {
      setBusySubmission("");
    }
  };

  return (
    <div className="creator-layout">
      <section className="main-column">
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR CREATOR OVERVIEW</p>
            <h2>Your impact, in numbers</h2>
          </div>
        </div>
        <div className="metric-grid creator-metrics">
          <article className="metric-card">
            <span className="metric-label">Total earnings</span>
            <strong>{money(totalPaid)}</strong>
            <span className="metric-footnote">Actually allocated to you</span>
            <span className="metric-icon mint">₹</span>
          </article>
          <article className="metric-card">
            <span className="metric-label">Active submissions</span>
            <strong>{submissions.length}</strong>
            <span className="metric-footnote">Posts in your portfolio</span>
            <span className="metric-icon lavender">↗</span>
          </article>
          <article className="metric-card">
            <span className="metric-label">Campaigns to explore</span>
            <strong>{campaigns.length}</strong>
            <span className="metric-footnote">With budget available</span>
            <span className="metric-icon peach">✳</span>
          </article>
        </div>

        <div className="section-heading list-heading">
          <div>
            <p className="eyebrow">FIND YOUR NEXT COLLABORATION</p>
            <h2>Open campaigns</h2>
          </div>
          <span className="campaign-count">
            {campaigns.length} available
          </span>
        </div>
        {loading ? (
          <div className="empty-card">Finding open campaigns…</div>
        ) : campaigns.length === 0 ? (
          <div className="empty-card compact-empty">
            <span className="empty-icon">✳</span>
            <h3>No open campaigns just yet</h3>
            <p>New opportunities will show up here when brands launch them.</p>
          </div>
        ) : (
          <div className="open-campaign-list">
            {campaigns.map((campaign) => {
              const available =
                campaign.remainingBudget ??
                campaign.totalBudget - (campaign.spentBudget ?? 0);
              const isSelected = selectedCampaign === campaign._id;
              return (
                <article className="open-campaign-card" key={campaign._id}>
                  <div className="campaign-card-top">
                    <div className="campaign-avatar creator-avatar">
                      {campaign.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="campaign-title">
                      <h3>{campaign.name}</h3>
                      <span>{campaign.platform}</span>
                    </div>
                    <span className="status-pill">Open</span>
                  </div>
                  <div className="open-campaign-details">
                    <span>
                      <small>Budget available</small>
                      <strong>{money(available)}</strong>
                    </span>
                    <span>
                      <small>Highest milestone</small>
                      <strong>
                        {money(campaign.milestones.at(-1)?.payout ?? 0)}
                      </strong>
                    </span>
                    <span>
                      <small>View tiers</small>
                      <strong>{campaign.milestones.length}</strong>
                    </span>
                  </div>
                  <button
                    className={`button ${isSelected ? "button-selected" : "button-secondary"} campaign-select-button`}
                    onClick={() => setSelectedCampaign(campaign._id)}
                    type="button"
                  >
                    {isSelected ? "Selected for submission" : "Choose campaign"}
                    <span aria-hidden="true">{isSelected ? "✓" : "→"}</span>
                  </button>
                </article>
              );
            })}
          </div>
        )}

        <div className="section-heading list-heading">
          <div>
            <p className="eyebrow">YOUR WORK, YOUR REWARDS</p>
            <h2>Your submissions</h2>
          </div>
          <button className="button button-quiet refresh-button" onClick={loadCreatorData}>
            ↻ Refresh
          </button>
        </div>
        {loading ? (
          <div className="empty-card">Loading your creator space…</div>
        ) : submissions.length === 0 ? (
          <div className="empty-card">
            <span className="empty-icon">↗</span>
            <h3>Your next post could be here</h3>
            <p>Browse an open campaign and submit a post to get started.</p>
          </div>
        ) : (
          <div className="submission-list">
            {submissions.map((submission) => {
              const campaign = campaignFromSubmission(submission);
              return (
                <article className="submission-card" key={submission._id}>
                  <div className="submission-top">
                    <div className="campaign-avatar creator-avatar">
                      {(campaign?.name ?? "S").charAt(0).toUpperCase()}
                    </div>
                    <div className="campaign-title">
                      <h3>{campaign?.name ?? "Campaign"}</h3>
                      <a href={submission.postUrl} target="_blank" rel="noreferrer">
                        View your post <span aria-hidden="true">↗</span>
                      </a>
                    </div>
                    <span className="submission-views">
                      {submission.views.toLocaleString("en-IN")} views
                    </span>
                  </div>
                  <div className="earning-row">
                    <span>
                      <small>Target payout</small>
                      <strong>{money(submission.targetPayout)}</strong>
                    </span>
                    <span>
                      <small>Paid to you</small>
                      <strong className="paid-amount">{money(submission.paidAmount)}</strong>
                    </span>
                  </div>
                  <form
                    className="views-update"
                    onSubmit={(event) => void updateViews(event, submission)}
                  >
                    <label className="field">
                      <span>Simulate updated views</span>
                      <input
                        type="number"
                        min={submission.views}
                        step="1"
                        value={viewInputs[submission._id] ?? String(submission.views)}
                        onChange={(event) =>
                          setViewInputs((current) => ({
                            ...current,
                            [submission._id]: event.target.value,
                          }))
                        }
                        required
                      />
                    </label>
                    {campaign && (
                      <p className="field-note">
                        Estimated target:{" "}
                        {money(
                          getTargetPayout(
                            campaign.milestones,
                            Number(
                              viewInputs[submission._id] ??
                                String(submission.views)
                            )
                          )
                        )}
                        {" · "}additional payout:{" "}
                        {money(
                          getIncrementalPayout(
                            getTargetPayout(
                              campaign.milestones,
                              Number(
                                viewInputs[submission._id] ??
                                  String(submission.views)
                              )
                            ),
                            submission.paidAmount
                          )
                        )}
                        {" · "}final amount is confirmed by the API
                      </p>
                    )}
                    <button
                      className="button button-secondary"
                      disabled={busySubmission === submission._id}
                    >
                      {busySubmission === submission._id ? "Updating…" : "Update views"}
                    </button>
                  </form>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <aside className="side-column">
        <section className="panel submit-panel">
          <div className="panel-heading">
            <span className="panel-icon creator-panel-icon">↗</span>
            <div>
              <p className="eyebrow">MAKE YOUR MOVE</p>
              <h2>Submit a post</h2>
            </div>
          </div>
          <form className="form-stack compact-form" onSubmit={submitPost}>
            <label className="field">
              <span>Choose a campaign</span>
              <select
                value={selectedCampaign}
                onChange={(event) => setSelectedCampaign(event.target.value)}
                required
              >
                <option value="">Select an opportunity</option>
                {campaigns.map((campaign) => (
                  <option key={campaign._id} value={campaign._id}>
                    {campaign.name} · {campaign.platform}
                  </option>
                ))}
              </select>
            </label>
            {selectedCampaign && (
              <div className="selected-campaign">
                {(() => {
                  const campaign = campaigns.find(
                    (item) => item._id === selectedCampaign
                  );
                  return campaign ? (
                    <>
                      <span>Available budget</span>
                      <strong>
                        {money(
                          campaign.remainingBudget ??
                            campaign.totalBudget -
                              (campaign.spentBudget ?? 0)
                        )}
                      </strong>
                      <small>
                        {campaign.milestones.length} view-based payout{" "}
                        {campaign.milestones.length === 1 ? "tier" : "tiers"}
                      </small>
                    </>
                  ) : null;
                })()}
              </div>
            )}
            <label className="field">
              <span>Link to your post</span>
              <input
                type="url"
                value={postUrl}
                onChange={(event) => setPostUrl(event.target.value)}
                placeholder="https://instagram.com/p/..."
                required
              />
            </label>
            <button
              className="button button-primary full-button"
              disabled={busyCampaign !== "" || campaigns.length === 0}
            >
              {busyCampaign ? "Submitting…" : "Submit post"}
              {!busyCampaign && <span aria-hidden="true">→</span>}
            </button>
            {campaigns.length === 0 && !loading && (
              <p className="field-note">
                There are no live campaigns with budget right now. Check back soon.
              </p>
            )}
          </form>
        </section>

        <section className="tips-card">
          <span className="tips-icon">✳</span>
          <p className="eyebrow">PAYOUT TIP</p>
          <h3>Only the highest milestone counts.</h3>
          <p>
            Your target payout follows the top view tier you reach. Earnings
            show what the campaign has actually allocated.
          </p>
        </section>
      </aside>
    </div>
  );
}
