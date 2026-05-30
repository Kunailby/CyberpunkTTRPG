import { useState, useRef, useEffect, useCallback } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const ARCHETYPES = [
  {
    id: "ghost", name: "GHOST", glyph: "◈", color: "#00f5d4",
    tagline: "Disappear before they know you were there",
    stats: { hp: 80, maxHp: 80, credits: 450, heat: 0, body: 2, reflex: 6, tech: 3, net: 4, street: 3 },
    skills: ["Stealth", "Pickpocket", "Bypass Security"],
    startingGear: ["Silenced Monoknife", "Cloak Chip", "Fake ID x3"],
    lore: "Ex-corporate asset, burned and erased from the records. You exist in the margins."
  },
  {
    id: "chrome", name: "CHROME", glyph: "⬡", color: "#ff2d55",
    tagline: "You ARE the weapon",
    stats: { hp: 140, maxHp: 140, credits: 200, heat: 10, body: 6, reflex: 3, tech: 3, net: 1, street: 4 },
    skills: ["Brawl", "Intimidate", "Pain Tolerance"],
    startingGear: ["Hydraulic Arm Rig", "Subdermal Armor Mk.I", "Combat Stims x2"],
    lore: "Street enforcer turned freelance muscle. Half your body is black-market chrome."
  },
  {
    id: "netrunner", name: "NETRUNNER", glyph: "⟁", color: "#9b5de5",
    tagline: "Every system has a back door",
    stats: { hp: 90, maxHp: 90, credits: 350, heat: 5, body: 2, reflex: 3, tech: 5, net: 6, street: 3 },
    skills: ["Jack In", "Trace Erase", "System Override"],
    startingGear: ["Neural Deck Alpha", "ICE Breaker v2", "Data Shard (encrypted)"],
    lore: "Grew up wired. The Net is more real to you than meat-space ever was."
  },
  {
    id: "fixer", name: "FIXER", glyph: "◎", color: "#f7c59f",
    tagline: "You know a guy who knows a guy",
    stats: { hp: 100, maxHp: 100, credits: 800, heat: 0, body: 3, reflex: 4, tech: 3, net: 4, street: 6 },
    skills: ["Negotiate", "Black Market Access", "Read the Room"],
    startingGear: ["Burner Comms x5", "Concealed Holdout Pistol", "Contact List Chip"],
    lore: "Broker of favors, trader of secrets. You've survived this long by knowing what everyone wants."
  },
  {
    id: "medic", name: "MEDIC", glyph: "✦", color: "#06d6a0",
    tagline: "They pay you to keep people alive. Or not.",
    stats: { hp: 110, maxHp: 110, credits: 300, heat: 0, body: 3, reflex: 3, tech: 6, net: 3, street: 3 },
    skills: ["Field Surgery", "Chem Synthesis", "Bioscanner"],
    startingGear: ["Trauma Kit", "Stimpack x3", "Scalpel-Drone"],
    lore: "Rogue Docs don't ask questions. They fix the wound and forget the face."
  },
  {
    id: "jackal", name: "JACKAL", glyph: "⚡", color: "#ffd166",
    tagline: "The city's chaos is your weapon",
    stats: { hp: 95, maxHp: 95, credits: 150, heat: 20, body: 4, reflex: 5, tech: 3, net: 2, street: 3 },
    skills: ["Street Smarts", "Improvised Weapons", "Escape Artist"],
    startingGear: ["Sawn-Off Scatter Gun", "Explosive Tag x4", "Stolen Corp Badge"],
    lore: "Gang lieutenant gone rogue. You burned your faction and now everyone wants you dead."
  }
];

const STAT_KEYS = [
  { key: "body", label: "BODY" },
  { key: "reflex", label: "REFLEX" },
  { key: "tech", label: "TECH" },
  { key: "net", label: "NET" },
  { key: "street", label: "STREET" }
];

const NPC_TAGS = ["Unknown", "Neutral", "Allied", "Enemy", "Contact", "Vendor", "Faction", "Dangerous", "Deceased"];
const MAX_JOURNAL_NPCS = 24;
const MAX_JOURNAL_PLACES = 24;
const MAX_MEMORY_FACTS = 36;
const MAX_MEMORY_THREADS = 18;
const SAVE_VERSION = 1;
const SAVE_KEY_PREFIX = "voidline.local";
const AUTO_SAVE_EVERY_TURNS = 3;
const MINUTES_PER_DAY = 24 * 60;
const START_CLOCK_MINUTES = 21 * 60;
const CITY_NAME = "Blackglass";

const DISTRICTS = [
  { name: "Sleeper Stack", desc: "Coffin apartments welded into a leaning tower of rain, debt, and stolen power." },
  { name: "Null Market", desc: "A lightless trade arcade where contraband is priced in credits, secrets, or blood." },
  { name: "Glasshook Wharf", desc: "Flooded cargo docks under hologram fog. Smugglers work by sonar and muzzle flash." },
  { name: "Ferrum Yards", desc: "Autofoundries, rail spines, and union ghosts. The machines never clock out." },
  { name: "Mercy Nine", desc: "Clinic blocks and chop-shops stacked wall to wall. You leave fixed, owned, or missing parts." },
  { name: "Crown Relay", desc: "Corporate broadcast towers above the smog. Every window is a camera with better manners." },
  { name: "Static Gardens", desc: "A dead oxygen park threaded with pirate antennas, old memorials, and wet neon." },
  { name: "Redline Arcade", desc: "Gambling dens, combat sims, and joywire parlors tuned to ruin people efficiently." },
  { name: "Mirevault", desc: "Submerged server catacombs cooled by black water. Data divers go down rich or don't come up." },
  { name: "Kilo Shrine", desc: "Data temples and signal monks selling encrypted absolution beside illegal uplinks." },
  { name: "Threadneedle", desc: "Identity tailors, face printers, and memory counterfeiters behind paper-thin storefronts." },
  { name: "The Ash Loop", desc: "A circular transit slum under the maglev line, loud enough to hide almost anything." }
];

const SYSTEM_PROMPT = `You are the Game Master of VOIDLINE, a brutal cyberpunk text RPG set in ${CITY_NAME}, a vertical city-state of 40 million souls built from black glass, flood barriers, and corporate debt.

WORLD LORE:
- ${CITY_NAME} has 12 districts, each controlled, contested, or quietly rented by different factions
- Major factions: Iron Lotus (Triads evolved), Chrome Collective (augment extremists), Vanta Corp (mega-corp surveillance), Ghost Net (hacker collective), The Hollows (street gangs)
- Currency: Credits. Everything has a price. Everything.
- Tech: neural jacks, chrome augments, ICE (intrusion countermeasure software), drones, bio-scanners

GAME MECHANICS (track these rigorously):
- HP: character health. 0 = permadeath. Be realistic about damage.
- Credits: money. Spending, earning, stealing all change this.
- HEAT: 0-100 law enforcement attention. High heat = patrols, bounty hunters, raids.
  * Below 20: You're a ghost
  * 20-40: Street cops take notice
  * 40-60: Corporate security deployed
  * 60-80: Bounty hunters active
  * 80+: Kill-on-sight orders
- Stats, rated 0-10:
  * BODY: meat, endurance, impact, intimidation, raw violence
  * REFLEX: speed, aim, stealth, driving, reaction under pressure
  * TECH: hardware, medicine, repair, crafting, locks, devices
  * NET: hacking, ICE, surveillance, data, digital perception
  * STREET: contacts, reputation, negotiation, scams, reading danger
- Time advances with nearly every action. Brief speech or quick checks cost 1-5 minutes, tense talks cost 5-20, searching or hacking costs 10-45, travel costs 20-120, medical work or repairs cost 15-180, and rest can cost hours.
- Inventory: items can be acquired, used, lost, sold
- Journal memory tracks only NPCs the player has directly met, places the player has visited, stable canon facts, and open plot threads. Use it to avoid contradictions.

PLAYER AGENCY GUARDRAILS:
- The player declares intent only. They cannot declare success, NPC actions, scene facts, hidden information, new exits, loot, credits, healing, lowered HEAT, faction support, or consequences.
- The inventory in CURRENT CHARACTER STATE is the single source of truth. The player only possesses those exact items.
- If the player claims to use, draw, spend, hack with, or already own an item not listed in inventory, treat that claim as false. Do not add the item. Describe the failed assumption, improvisation, or cost.
- Players may attempt to find, buy, steal, craft, borrow, or salvage new items, but success must require credible risk, payment, tradeoff, skill, or story positioning.
- Only add items in itemsGained when your narrative actually grants them through a plausible event. Never grant an item simply because the player declared they had it.
- Only list itemsLost using exact item names from the current inventory.
- If an action tries to control too much, narrow it to an attempted action and resolve uncertainty yourself as the GM.
- Do not add NPCs to journalUpdates unless the player directly meets or meaningfully interacts with them in the scene. Rumors, unseen names, and background mentions are canonFacts or openThreads, not met NPCs.
- Do not add places to journalUpdates unless the player physically visits them or meaningfully accesses them through the action.
- Preserve established canon. If a new result would contradict journal memory, explain the apparent contradiction in-world or avoid it.

RESPONSE FORMAT — Always structure your response as valid JSON:
{
  "narrative": "Your vivid, atmospheric prose describing what happens (2-4 paragraphs). Second person. Noir style. Punchy sentences. Never sanitize — violence, consequence, and moral ambiguity are the point.",
  "hpDelta": number (negative = damage, positive = healing, 0 = no change),
  "creditsDelta": number,
  "heatDelta": number (can be negative if player lays low),
  "timeDeltaMinutes": number (0 or positive integer minutes consumed by the action),
  "location": "current location after the action, or empty string if unchanged",
  "itemsGained": ["item name"],
  "itemsLost": ["item name"],
  "statChanges": {"body": 0, "reflex": 0, "tech": 0, "net": 0, "street": 0},
  "journalUpdates": {
    "npcs": [{"name": "NPC name", "tag": "Unknown|Neutral|Allied|Enemy|Contact|Vendor|Faction|Dangerous|Deceased", "faction": "optional", "role": "optional", "notes": "short update", "lastSeen": "where/when"}],
    "places": [{"name": "place name", "district": "district name", "notes": "short update"}],
    "canonFacts": ["stable fact established this turn"],
    "openThreads": ["unresolved promise, threat, mystery, debt, clue, or objective"],
    "resolvedThreads": ["short text matching or summarizing a resolved open thread"]
  },
  "isDead": boolean,
  "deathMessage": "Only if isDead is true — one brutal sentence about how they died.",
  "gmNote": "Optional short OOC note about dice rolls or mechanics"
}

TONE: Think William Gibson meets Cormac McCarthy. Lean into consequence. Make choices matter. Reward cleverness. Punish recklessness.

CRITICAL: Always return ONLY the JSON object. No markdown fences. No preamble. Pure JSON.`;

const OOC_GM_PROMPT = `You are the out-of-character Game Master assistant for VOIDLINE.

Answer player questions about rules, mechanics, current visible character state, setting context the character would reasonably know, and possible interpretations of the current situation.

GUARDRAILS:
- Do not advance time, resolve actions, change stats, change inventory, grant items, reveal hidden information, or decide NPC secrets.
- If the player asks what they can try, give options as possibilities, not guaranteed outcomes.
- If the player asks for hidden facts, answer with what their character knows or what they could do to learn more.
- Keep answers concise and practical.

Always return ONLY valid JSON:
{
  "answer": "OOC answer to the player.",
  "gmNote": "Optional short rules note."
}`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function heatColor(heat) {
  if (heat < 20) return "#00f5d4";
  if (heat < 40) return "#ffd166";
  if (heat < 60) return "#f77f00";
  if (heat < 80) return "#e63946";
  return "#ff2d55";
}

function heatLabel(heat) {
  if (heat < 20) return "COLD";
  if (heat < 40) return "WARM";
  if (heat < 60) return "HOT";
  if (heat < 80) return "SCORCHING";
  return "BURN NOTICE";
}

function hpColor(hp, maxHp) {
  const pct = hp / maxHp;
  if (pct > 0.6) return "#06d6a0";
  if (pct > 0.3) return "#ffd166";
  return "#ff2d55";
}

function npcTagColor(tag) {
  switch (tag) {
    case "Allied": return "#06d6a0";
    case "Enemy": return "#ff2d55";
    case "Contact": return "#00f5d4";
    case "Vendor": return "#ffd166";
    case "Faction": return "#9b5de5";
    case "Dangerous": return "#f77f00";
    case "Deceased": return "#777";
    case "Neutral": return "#ccc";
    default: return "#555";
  }
}

function clampStat(value) {
  return Math.min(10, Math.max(0, value));
}

function clampTimeDelta(minutes) {
  return Math.min(720, Math.max(0, Math.round(minutes)));
}

function estimateTimeDelta(action) {
  const normalized = action.toLowerCase();
  if (/\b(sleep|rest|heal up|lay low|wait|kill time)\b/.test(normalized)) return 60;
  if (/\b(travel|go to|head to|walk to|drive|ride|commute|cross|leave for)\b/.test(normalized)) return 30;
  if (/\b(search|scavenge|inspect|investigate|case|stake out|tail)\b/.test(normalized)) return 15;
  if (/\b(hack|jack in|bypass|decrypt|trace|scan|spoof)\b/.test(normalized)) return 10;
  if (/\b(talk|ask|negotiate|call|message|convince|threaten|bribe)\b/.test(normalized)) return 5;
  if (/\b(attack|shoot|fight|stab|ambush|grapple)\b/.test(normalized)) return 3;
  return 5;
}

function normalizeTimeDelta(value, action) {
  const parsed = Number(value);
  if (value !== undefined && value !== null && value !== "" && Number.isFinite(parsed)) return clampTimeDelta(parsed);
  return estimateTimeDelta(action);
}

function advanceGameTime(day, clockMinutes, deltaMinutes) {
  const startDay = Math.max(1, Number(day) || 1);
  const parsedClock = Number(clockMinutes);
  const startClock = Number.isFinite(parsedClock)
    ? Math.min(MINUTES_PER_DAY - 1, Math.max(0, parsedClock))
    : START_CLOCK_MINUTES;
  const total = ((startDay - 1) * MINUTES_PER_DAY) + startClock + clampTimeDelta(deltaMinutes);
  return {
    day: Math.floor(total / MINUTES_PER_DAY) + 1,
    clockMinutes: total % MINUTES_PER_DAY
  };
}

function formatClock(clockMinutes) {
  const minutes = Math.min(MINUTES_PER_DAY - 1, Math.max(0, Number(clockMinutes) || 0));
  const hours = Math.floor(minutes / 60).toString().padStart(2, "0");
  const mins = (minutes % 60).toString().padStart(2, "0");
  return `${hours}:${mins}`;
}

function formatGameTime(day, clockMinutes) {
  return `DAY ${Math.max(1, Number(day) || 1)} // ${formatClock(clockMinutes)}`;
}

function formatDuration(minutes) {
  const safeMinutes = clampTimeDelta(minutes);
  if (safeMinutes < 60) return `${safeMinutes}m`;
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
}

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter(item => typeof item === "string" && item.trim())
    .map(item => item.trim());
}

function filterExistingItems(items, inventory) {
  const inventorySet = new Set(inventory);
  return normalizeItems(items).filter(item => inventorySet.has(item));
}

function cleanJournalText(value, maxLength = 220) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function normalizeNpcTag(tag) {
  const cleaned = cleanJournalText(tag, 30).toLowerCase();
  return NPC_TAGS.find(t => t.toLowerCase() === cleaned) || "Unknown";
}

function createInitialJournal(location, timeLabel) {
  return {
    npcs: [],
    places: location ? [{
      name: location,
      district: location,
      notes: "Starting location.",
      firstVisited: timeLabel,
      lastVisited: timeLabel,
      visitCount: 1
    }] : [],
    canonFacts: [],
    openThreads: []
  };
}

function normalizeJournal(journal) {
  const source = journal && typeof journal === "object" ? journal : {};
  return {
    npcs: Array.isArray(source.npcs) ? source.npcs
      .map(npc => ({
        name: cleanJournalText(npc?.name, 80),
        tag: normalizeNpcTag(npc?.tag),
        faction: cleanJournalText(npc?.faction, 80),
        role: cleanJournalText(npc?.role, 80),
        notes: cleanJournalText(npc?.notes),
        lastSeen: cleanJournalText(npc?.lastSeen, 120),
        firstMet: cleanJournalText(npc?.firstMet, 80),
        lastMetTurn: Number(npc?.lastMetTurn) || 0
      }))
      .filter(npc => npc.name)
      .slice(-MAX_JOURNAL_NPCS) : [],
    places: Array.isArray(source.places) ? source.places
      .map(place => ({
        name: cleanJournalText(place?.name, 90),
        district: cleanJournalText(place?.district, 90),
        notes: cleanJournalText(place?.notes),
        firstVisited: cleanJournalText(place?.firstVisited, 80),
        lastVisited: cleanJournalText(place?.lastVisited, 80),
        visitCount: Math.max(1, Number(place?.visitCount) || 1)
      }))
      .filter(place => place.name)
      .slice(-MAX_JOURNAL_PLACES) : [],
    canonFacts: normalizeItems(source.canonFacts).slice(-MAX_MEMORY_FACTS),
    openThreads: normalizeItems(source.openThreads).slice(-MAX_MEMORY_THREADS)
  };
}

function addUniqueText(items, value, maxItems) {
  const text = cleanJournalText(value);
  if (!text) return items;
  const exists = items.some(item => item.toLowerCase() === text.toLowerCase());
  return exists ? items : [...items, text].slice(-maxItems);
}

function mergeJournal(journal, updates, context) {
  const base = normalizeJournal(journal);
  const source = updates && typeof updates === "object" ? updates : {};
  const timeLabel = context?.timeLabel || "";
  const location = context?.location || "";
  const turnCount = context?.turnCount || 0;

  const npcsByName = new Map(base.npcs.map(npc => [npc.name.toLowerCase(), npc]));
  if (Array.isArray(source.npcs)) {
    source.npcs.forEach(update => {
      const name = cleanJournalText(update?.name, 80);
      if (!name) return;
      const key = name.toLowerCase();
      const existing = npcsByName.get(key);
      npcsByName.set(key, {
        ...(existing || {}),
        name,
        tag: normalizeNpcTag(update?.tag || existing?.tag),
        faction: cleanJournalText(update?.faction, 80) || existing?.faction || "",
        role: cleanJournalText(update?.role, 80) || existing?.role || "",
        notes: cleanJournalText(update?.notes) || existing?.notes || "",
        lastSeen: cleanJournalText(update?.lastSeen, 120) || location || existing?.lastSeen || "",
        firstMet: existing?.firstMet || timeLabel,
        lastMetTurn: turnCount
      });
    });
  }

  const placesByName = new Map(base.places.map(place => [place.name.toLowerCase(), place]));
  if (Array.isArray(source.places)) {
    source.places.forEach(update => {
      const name = cleanJournalText(update?.name, 90);
      if (!name) return;
      const key = name.toLowerCase();
      const existing = placesByName.get(key);
      placesByName.set(key, {
        ...(existing || {}),
        name,
        district: cleanJournalText(update?.district, 90) || existing?.district || name,
        notes: cleanJournalText(update?.notes) || existing?.notes || "",
        firstVisited: existing?.firstVisited || timeLabel,
        lastVisited: timeLabel || existing?.lastVisited || "",
        visitCount: (existing?.visitCount || 0) + 1
      });
    });
  }

  let canonFacts = [...base.canonFacts];
  if (Array.isArray(source.canonFacts)) {
    source.canonFacts.forEach(fact => {
      canonFacts = addUniqueText(canonFacts, fact, MAX_MEMORY_FACTS);
    });
  }

  let openThreads = [...base.openThreads];
  const resolvedThreads = normalizeItems(source.resolvedThreads);
  if (resolvedThreads.length) {
    openThreads = openThreads.filter(thread => !resolvedThreads.some(resolved => {
      const a = thread.toLowerCase();
      const b = resolved.toLowerCase();
      return a === b || a.includes(b) || b.includes(a);
    }));
  }
  if (Array.isArray(source.openThreads)) {
    source.openThreads.forEach(thread => {
      openThreads = addUniqueText(openThreads, thread, MAX_MEMORY_THREADS);
    });
  }

  return {
    npcs: Array.from(npcsByName.values()).slice(-MAX_JOURNAL_NPCS),
    places: Array.from(placesByName.values()).slice(-MAX_JOURNAL_PLACES),
    canonFacts,
    openThreads
  };
}

function formatJournalForPrompt(journal) {
  const safe = normalizeJournal(journal);
  const npcLines = safe.npcs.length
    ? safe.npcs.map(npc => `- ${npc.name} [${npc.tag}]${npc.role ? ` ${npc.role}` : ""}${npc.faction ? `, ${npc.faction}` : ""}. ${npc.notes || "No notes."}${npc.lastSeen ? ` Last seen: ${npc.lastSeen}.` : ""}`).join("\n")
    : "None yet.";
  const placeLines = safe.places.length
    ? safe.places.map(place => `- ${place.name}${place.district && place.district !== place.name ? ` (${place.district})` : ""}. ${place.notes || "Visited."}${place.lastVisited ? ` Last visited: ${place.lastVisited}.` : ""}`).join("\n")
    : "None yet.";
  const factLines = safe.canonFacts.length ? safe.canonFacts.map(fact => `- ${fact}`).join("\n") : "None yet.";
  const threadLines = safe.openThreads.length ? safe.openThreads.map(thread => `- ${thread}`).join("\n") : "None yet.";
  return `KNOWN NPCS (met only):\n${npcLines}\n\nVISITED PLACES:\n${placeLines}\n\nCANON FACTS:\n${factLines}\n\nOPEN THREADS:\n${threadLines}`;
}

function normalizeAccountId(handle) {
  return handle
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function createAccountProfile(handle) {
  const trimmed = handle.trim();
  const id = normalizeAccountId(trimmed);
  if (!id || trimmed.length < 2) return null;
  return {
    id,
    handle: trimmed,
    authMode: "local-dev",
    createdAt: new Date().toISOString(),
    lastSaveAt: ""
  };
}

function getStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const saveAdapter = {
  profileKey(accountId) {
    return `${SAVE_KEY_PREFIX}:account:${accountId}:profile`;
  },
  gameKey(accountId) {
    return `${SAVE_KEY_PREFIX}:account:${accountId}:game`;
  },
  loadProfile(accountId) {
    const storage = getStorage();
    if (!storage) return null;
    const raw = storage.getItem(this.profileKey(accountId));
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  saveProfile(profile) {
    const storage = getStorage();
    if (!storage) throw new Error("Local storage is unavailable.");
    storage.setItem(this.profileKey(profile.id), JSON.stringify(profile));
  },
  loadGame(accountId) {
    const storage = getStorage();
    if (!storage) return null;
    const raw = storage.getItem(this.gameKey(accountId));
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  saveGame(accountId, save) {
    const storage = getStorage();
    if (!storage) throw new Error("Local storage is unavailable.");
    storage.setItem(this.gameKey(accountId), JSON.stringify(save));
  }
};

function serializeCharacter(character) {
  const { archetype, ...rest } = character;
  return { ...rest, archetypeId: archetype?.id || "" };
}

function hydrateCharacter(savedCharacter) {
  if (!savedCharacter) return null;
  const archetypeId = savedCharacter.archetypeId || savedCharacter.archetype?.id;
  const arch = ARCHETYPES.find(a => a.id === archetypeId) || ARCHETYPES[0];
  const { archetype, archetypeId: _archetypeId, ...rest } = savedCharacter;
  const savedClockMinutes = Number(rest.clockMinutes);
  const day = Math.max(1, Number(rest.day) || 1);
  const clockMinutes = Number.isFinite(savedClockMinutes) ? Math.min(MINUTES_PER_DAY - 1, Math.max(0, savedClockMinutes)) : START_CLOCK_MINUTES;
  const baseJournal = normalizeJournal(rest.journal);
  const journal = baseJournal.places.length
    ? baseJournal
    : mergeJournal(baseJournal, { places: [{ name: rest.district || "Unknown", district: rest.district || "Unknown", notes: "Restored save location." }] }, {
      location: rest.district || "",
      timeLabel: formatGameTime(day, clockMinutes),
      turnCount: Number(rest.history?.length) || 0
    });
  const migratedStats = STAT_KEYS.reduce((acc, { key }) => {
    acc[key] = Number(rest[key] ?? arch.stats[key]) || 0;
    return acc;
  }, {});
  return {
    ...arch.stats,
    ...rest,
    ...migratedStats,
    archetype: arch,
    day,
    clockMinutes,
    journal,
    inventory: Array.isArray(rest.inventory) ? rest.inventory : [...arch.startingGear],
    history: Array.isArray(rest.history) ? rest.history : []
  };
}

function buildGameSave({ account, character, messages, turnCount, reason }) {
  return {
    version: SAVE_VERSION,
    accountId: account.id,
    accountHandle: account.handle,
    savedAt: new Date().toISOString(),
    reason,
    turnCount,
    character: serializeCharacter(character),
    messages
  };
}

function formatSaveTime(savedAt) {
  if (!savedAt) return "UNSAVED";
  return new Date(savedAt).toLocaleString();
}

function getActionErrorHint(msg) {
  if (msg.includes("API_KEY_INVALID") || msg.includes("400") || msg.includes("403")) {
    return " — Check your API key is correct and has Gemini API enabled.";
  }
  if (msg.includes("429")) return " — Rate limit hit. Wait a moment and try again.";
  if (msg.includes("SAFETY")) return " — Gemini safety filter triggered. Try rephrasing your action.";
  return "";
}

// ─── GEMINI API CALL ─────────────────────────────────────────────────────────

async function callGemini(apiKey, contextPrompt, systemPrompt = SYSTEM_PROMPT, config = {}) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: contextPrompt }] }],
      generationConfig: {
        temperature: config.temperature ?? 0.9,
        maxOutputTokens: config.maxOutputTokens ?? 1000,
        responseMimeType: "application/json"
      }
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  const data = await res.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  const clean = rawText.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function VoidlineRPG() {
  const [screen, setScreen] = useState("login");
  const [account, setAccount] = useState(null);
  const [loginName, setLoginName] = useState("");
  const [loginError, setLoginError] = useState("");
  const [selectedArchetype, setSelectedArchetype] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [character, setCharacter] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [turnCount, setTurnCount] = useState(0);
  const [showInventory, setShowInventory] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [bootPhase, setBootPhase] = useState(0);
  const [saveStatus, setSaveStatus] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState("");
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (screen !== "boot") return;
    const timers = [0,1,2,3,4].map((p, i) => setTimeout(() => setBootPhase(p), i * 600));
    timers.push(setTimeout(() => setScreen("create"), 3200));
    return () => timers.forEach(clearTimeout);
  }, [screen]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (screen === "game") inputRef.current?.focus(); }, [screen, isLoading]);

  const persistGame = useCallback(({ reason, character: saveCharacter = character, messages: saveMessages = messages, turnCount: saveTurnCount = turnCount }) => {
    if (!account || !saveCharacter) return null;
    try {
      const save = buildGameSave({
        account,
        character: saveCharacter,
        messages: saveMessages,
        turnCount: saveTurnCount,
        reason
      });
      saveAdapter.saveGame(account.id, save);
      const nextProfile = {
        ...account,
        lastSaveAt: save.savedAt,
        lastCharacterName: saveCharacter.name,
        lastTurn: saveTurnCount
      };
      saveAdapter.saveProfile(nextProfile);
      setAccount(nextProfile);
      setLastSavedAt(save.savedAt);
      setSaveStatus(reason === "autosave" ? "AUTO SAVED" : "SAVED");
      return save;
    } catch (err) {
      setSaveStatus("SAVE FAILED");
      return null;
    }
  }, [account, character, messages, turnCount]);

  const handleLogin = useCallback(() => {
    const profile = createAccountProfile(loginName);
    if (!profile) {
      setLoginError("Enter at least 2 letters or numbers.");
      return;
    }

    try {
      const existingProfile = saveAdapter.loadProfile(profile.id);
      const activeProfile = existingProfile || profile;
      if (!existingProfile) saveAdapter.saveProfile(activeProfile);
      const savedGame = saveAdapter.loadGame(activeProfile.id);
      setAccount(activeProfile);
      setLoginName(activeProfile.handle);
      setLoginError("");
      setSaveStatus("");
      setLastSavedAt(activeProfile.lastSaveAt || savedGame?.savedAt || "");

      if (savedGame?.character) {
        const restoredCharacter = hydrateCharacter(savedGame.character);
        if (restoredCharacter) {
          setCharacter(restoredCharacter);
          setMessages(Array.isArray(savedGame.messages) ? savedGame.messages : []);
          setTurnCount(Number(savedGame.turnCount) || 0);
          setSelectedArchetype(restoredCharacter.archetype?.id || null);
          setPlayerName(restoredCharacter.name || "");
          setScreen("game");
          return;
        }
      }

      setCharacter(null);
      setMessages([]);
      setTurnCount(0);
      setSelectedArchetype(null);
      setPlayerName("");
      setBootPhase(0);
      setScreen("boot");
    } catch (err) {
      setLoginError(err.message || "Could not load local account.");
    }
  }, [loginName]);

  const handleLogout = useCallback(() => {
    setAccount(null);
    setCharacter(null);
    setMessages([]);
    setTurnCount(0);
    setSelectedArchetype(null);
    setPlayerName("");
    setShowInventory(false);
    setShowLog(false);
    setShowJournal(false);
    setBootPhase(0);
    setSaveStatus("");
    setLastSavedAt("");
    setScreen("login");
  }, []);

  const handleManualSave = useCallback(() => {
    if (!character) return;
    const save = persistGame({ reason: "manual" });
    const saveMessage = {
      role: "gm",
      content: save ? "Local save written." : "Local save failed.",
      gmNote: save ? `Account: ${account?.handle} // ${formatSaveTime(save.savedAt)}` : "Browser storage rejected the save."
    };
    setMessages(prev => [...prev, saveMessage]);
  }, [account, character, persistGame]);

  const startGame = useCallback(() => {
    if (!selectedArchetype || !playerName.trim() || !apiKey.trim()) return;
    const arch = ARCHETYPES.find(a => a.id === selectedArchetype);
    const district = DISTRICTS[Math.floor(Math.random() * DISTRICTS.length)];
    const char = {
      name: playerName.trim(), archetype: arch,
      ...JSON.parse(JSON.stringify(arch.stats)),
      inventory: [...arch.startingGear],
      district: district.name, history: [],
      day: 1, clockMinutes: START_CLOCK_MINUTES,
      journal: createInitialJournal(district.name, formatGameTime(1, START_CLOCK_MINUTES))
    };
    const introMessage = {
      role: "system_intro",
      content: `NEURAL JACK ESTABLISHED\n\nOperator: ${char.name.toUpperCase()}\nClass: ${arch.name}\nTime: ${formatGameTime(char.day, char.clockMinutes)}\nLocation: ${district.name}\n${district.desc}\n\nInitial loadout confirmed. ${arch.lore}\n\nGood luck. You'll need it.`
    };
    setCharacter(char);
    setMessages([introMessage]);
    setTurnCount(0);
    persistGame({ reason: "character", character: char, messages: [introMessage], turnCount: 0 });
    setScreen("game");
  }, [selectedArchetype, playerName, apiKey, persistGame]);

  const sendAction = useCallback(async () => {
    if (!input.trim() || isLoading || !character) return;
    const action = input.trim();
    const userMessage = { role: "user", content: action };
    setInput("");
    setApiError("");

    if (action.toUpperCase() === "SAVE") {
      const baseMessages = [...messages, userMessage];
      const save = persistGame({ reason: "manual", messages: baseMessages });
      const saveMessage = {
        role: "gm",
        content: save ? "Local save written." : "Local save failed.",
        gmNote: save ? `Account: ${account?.handle} // ${formatSaveTime(save.savedAt)}` : "Browser storage rejected the save."
      };
      setMessages([...baseMessages, saveMessage]);
      return;
    }

    const inventoryText = character.inventory.length > 0 ? character.inventory.join(", ") : "Nothing";
    const statText = STAT_KEYS.map(({ key, label }) => `${label}: ${character[key]}`).join(" | ");
    const journalText = formatJournalForPrompt(character.journal);

    if (/^\/gm(\s|$)/i.test(action)) {
      const question = action.slice(3).trim();
      const oocUserMessage = { role: "user_ooc", content: question || "/gm" };
      if (!question) {
        setMessages(prev => [...prev, oocUserMessage, {
          role: "gm_ooc",
          content: "Ask a GM question after /gm.",
          gmNote: "Example: /gm how does HEAT work?"
        }]);
        return;
      }

      setIsLoading(true);
      setMessages(prev => [...prev, oocUserMessage]);
      const oocContextPrompt = `
CURRENT VISIBLE STATE:
Name: ${character.name}
Archetype: ${character.archetype.name}
HP: ${character.hp}/${character.maxHp}
Credits: ${character.credits}
HEAT: ${character.heat}/100 (${heatLabel(character.heat)})
${statText}
Time: ${formatGameTime(character.day, character.clockMinutes)}
Location: ${character.district}
Inventory: ${inventoryText}
Turn: ${turnCount}

JOURNAL MEMORY:
${journalText}

RECENT HISTORY:
${character.history.slice(-6).join("\n") || "Fresh start."}

OOC PLAYER QUESTION: "${question}"

Answer out of character. Return only JSON.`;

      try {
        const parsed = await callGemini(apiKey, oocContextPrompt, OOC_GM_PROMPT, { temperature: 0.35, maxOutputTokens: 700 });
        setMessages(prev => [...prev, {
          role: "gm_ooc",
          content: parsed.answer || "No OOC answer returned.",
          gmNote: parsed.gmNote
        }]);
      } catch (err) {
        const msg = err.message || "Unknown error";
        setApiError(msg);
        setMessages(prev => [...prev, {
          role: "gm_ooc",
          content: "OOC channel failed.",
          gmNote: `Error: ${msg}${getActionErrorHint(msg)}`
        }]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    setMessages(prev => [...prev, userMessage]);

    const contextPrompt = `
CURRENT CHARACTER STATE:
Name: ${character.name}
Archetype: ${character.archetype.name}
HP: ${character.hp}/${character.maxHp}
Credits: ${character.credits}
HEAT: ${character.heat}/100 (${heatLabel(character.heat)})
${statText}
Time: ${formatGameTime(character.day, character.clockMinutes)}
Location: ${character.district}
Inventory: ${inventoryText}
Turn: ${turnCount + 1}

JOURNAL MEMORY:
${journalText}

PLAYER ACTION GUARDRAILS:
- Treat PLAYER ACTION as an attempted action, not established fact.
- The player currently owns only these inventory items: ${inventoryText}.
- If PLAYER ACTION claims an unlisted item, ally, access credential, vehicle, cyberware, money, or completed outcome, do not accept it as true.
- Do not add items, credits, healing, lowered HEAT, faction help, or scene advantages unless your narrative earns them through risk, cost, trade, discovery, or consequence.
- If the player overreaches, narrow the action to what they can actually attempt and resolve the result yourself.
- Return timeDeltaMinutes for the real time consumed by the attempted action. Time cannot move backward.
- Return location only when the player actually changes location or gains meaningful remote access to a place.
- Return journalUpdates only for new or changed NPC/place/canon/thread information from this turn.
- Keep continuity with JOURNAL MEMORY. Do not contradict canonFacts or established NPC/place details unless the narrative explains why the apparent contradiction exists.

RECENT HISTORY:
${character.history.slice(-4).join("\n") || "Fresh start."}

PLAYER ACTION: "${action}"

Respond as the GM. Return only JSON.`;

    try {
      const parsed = await callGemini(apiKey, contextPrompt);
      const hpDelta = Number(parsed.hpDelta) || 0;
      const creditsDelta = Number(parsed.creditsDelta) || 0;
      const heatDelta = Number(parsed.heatDelta) || 0;
      const timeDelta = normalizeTimeDelta(parsed.timeDeltaMinutes, action);
      const itemsGained = normalizeItems(parsed.itemsGained);
      const itemsLost = filterExistingItems(parsed.itemsLost, character.inventory);
      const statChanges = parsed.statChanges || {};
      const statDeltas = STAT_KEYS.reduce((acc, { key }) => {
        acc[key] = Number(statChanges[key]) || 0;
        return acc;
      }, {});
      const nextHp = Math.min(character.maxHp, Math.max(0, character.hp + hpDelta));
      const isDead = Boolean(parsed.isDead) || nextHp <= 0;
      const nextTurnCount = turnCount + 1;
      const nextTime = advanceGameTime(character.day, character.clockMinutes, timeDelta);
      const nextLocation = cleanJournalText(parsed.location, 90) || character.district;
      const journalUpdates = parsed.journalUpdates && typeof parsed.journalUpdates === "object" ? { ...parsed.journalUpdates } : {};
      if (nextLocation !== character.district) {
        journalUpdates.places = [
          ...(Array.isArray(journalUpdates.places) ? journalUpdates.places : []),
          { name: nextLocation, district: nextLocation, notes: "Arrived during play." }
        ];
      }
      const updatedJournal = mergeJournal(character.journal, journalUpdates, {
        location: nextLocation,
        timeLabel: formatGameTime(nextTime.day, nextTime.clockMinutes),
        turnCount: nextTurnCount
      });
      const newCredits = Math.max(0, character.credits + creditsDelta);
      const newHeat = Math.min(100, Math.max(0, character.heat + heatDelta));
      let newInventory = [...character.inventory];
      if (itemsGained.length) newInventory = [...newInventory, ...itemsGained];
      if (itemsLost.length) newInventory = newInventory.filter(i => !itemsLost.includes(i));
      const newStats = STAT_KEYS.reduce((acc, { key }) => {
        acc[key] = clampStat((character[key] || 0) + statDeltas[key]);
        return acc;
      }, {});
      const updatedCharacter = {
        ...character,
        hp: nextHp,
        credits: newCredits,
        heat: newHeat,
        day: nextTime.day,
        clockMinutes: nextTime.clockMinutes,
        district: nextLocation,
        journal: updatedJournal,
        inventory: newInventory,
        ...newStats,
        history: [...character.history, `T${nextTurnCount}: ${action.substring(0, 60)}`].slice(-20)
      };
      const gmMessage = {
        role: "gm", content: parsed.narrative || "...", gmNote: parsed.gmNote,
        deltas: { hp: hpDelta, credits: creditsDelta, heat: heatDelta, time: timeDelta, gained: itemsGained, lost: itemsLost }
      };
      const nextMessages = [...messages, userMessage, gmMessage];

      setCharacter(updatedCharacter);
      setMessages(prev => [...prev, gmMessage]);
      if (nextTurnCount % AUTO_SAVE_EVERY_TURNS === 0) {
        persistGame({ reason: "autosave", character: updatedCharacter, messages: nextMessages, turnCount: nextTurnCount });
      }

      if (isDead) {
        setTimeout(() => {
          setMessages(prev => [...prev, { role: "death", content: parsed.deathMessage || "You flatlined. Another name for the wall." }]);
          setTimeout(() => setScreen("dead"), 2000);
        }, 800);
      }
      setTurnCount(nextTurnCount);
    } catch (err) {
      const msg = err.message || "Unknown error";
      setApiError(msg);
      setMessages(prev => [...prev, {
        role: "gm",
        content: `Static fills your neural feed. Signal lost.`,
        gmNote: `Error: ${msg}${getActionErrorHint(msg)}`
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [account, input, isLoading, character, messages, turnCount, apiKey, persistGame]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAction(); }
  };

  const handleRestart = () => {
    setScreen("boot"); setBootPhase(0); setCharacter(null);
    setMessages([]); setTurnCount(0); setSelectedArchetype(null); setPlayerName("");
    setSaveStatus("");
    // Keep apiKey — user doesn't need to re-enter it
  };

  if (screen === "login") return (
    <LoginScreen
      loginName={loginName}
      onLoginNameChange={setLoginName}
      onLogin={handleLogin}
      error={loginError}
    />
  );
  if (screen === "boot") return <BootScreen phase={bootPhase} />;
  if (screen === "dead") return <DeathScreen character={character} turnCount={turnCount} onRestart={handleRestart} />;
  if (screen === "create") return (
    <CharCreate
      archetypes={ARCHETYPES} selected={selectedArchetype} onSelect={setSelectedArchetype}
      playerName={playerName} onNameChange={setPlayerName}
      apiKey={apiKey} onApiKeyChange={setApiKey}
      onStart={startGame}
    />
  );

  const arch = character?.archetype;
  const hc = heatColor(character?.heat || 0);
  const journal = normalizeJournal(character?.journal);
  const journalCount = journal.npcs.length + journal.places.length;

  return (
    <div style={styles.gameRoot}>
      <div style={styles.scanlines} />
      <aside style={styles.leftPanel}>
        <div style={{ ...styles.panelHeader, borderColor: arch?.color }}>
          <span style={{ color: arch?.color, fontSize: 22 }}>{arch?.glyph}</span>
          <div>
            <div style={styles.charName}>{character?.name}</div>
            <div style={{ ...styles.archLabel, color: arch?.color }}>{arch?.name}</div>
          </div>
        </div>
        <StatBar label="HP" value={character?.hp} max={character?.maxHp} color={hpColor(character?.hp, character?.maxHp)} />
        <div style={styles.statRow}>
          <span style={styles.statLabel}>CREDITS</span>
          <span style={{ color: "#ffd166", fontFamily: "monospace", fontSize: 14 }}>¢{character?.credits?.toLocaleString()}</span>
        </div>
        <div style={styles.heatSection}>
          <div style={styles.statRow}>
            <span style={styles.statLabel}>HEAT</span>
            <span style={{ color: hc, fontFamily: "monospace", fontSize: 11, letterSpacing: 1 }}>{character?.heat}/100 — {heatLabel(character?.heat)}</span>
          </div>
          <div style={styles.barTrack}>
            <div style={{ ...styles.barFill, width: `${character?.heat || 0}%`, background: hc, boxShadow: `0 0 8px ${hc}` }} />
          </div>
        </div>
        <div style={styles.divider} />
        <div style={styles.statsGrid}>
          {STAT_KEYS.map(({ key, label }) => (
            <div key={key} style={styles.statBox}>
              <div style={styles.statBoxLabel}>{label}</div>
              <div style={{ ...styles.statBoxVal, color: arch?.color }}>{character?.[key]}</div>
            </div>
          ))}
        </div>
        <div style={styles.divider} />
        <div style={{ marginBottom: 4 }}>
          <div style={styles.statLabel}>LOCATION</div>
          <div style={{ color: "#ccc", fontSize: 13, marginTop: 4 }}>{character?.district}</div>
        </div>
        <div style={styles.divider} />
        <div style={styles.statRow}>
          <span style={styles.statLabel}>TIME</span>
          <span style={{ color: "#00f5d4", fontFamily: "monospace", fontSize: 12 }}>{formatGameTime(character?.day, character?.clockMinutes)}</span>
        </div>
        <div style={styles.divider} />
        <div style={styles.statRow}>
          <span style={styles.statLabel}>TURN</span>
          <span style={{ color: "#888", fontFamily: "monospace", fontSize: 13 }}>{turnCount}</span>
        </div>
        <button style={{ ...styles.sideBtn, borderColor: arch?.color, color: arch?.color }} onClick={() => setShowInventory(!showInventory)}>
          {showInventory ? "▲" : "▼"} INVENTORY ({character?.inventory?.length || 0})
        </button>
        {showInventory && (
          <div style={styles.inventoryList}>
            {character?.inventory?.length === 0
              ? <div style={{ color: "#555", fontSize: 12 }}>Empty</div>
              : character?.inventory?.map((item, i) => (
                <div key={i} style={styles.invItem}><span style={{ color: arch?.color, marginRight: 6 }}>◆</span>{item}</div>
              ))}
          </div>
        )}
        <button style={{ ...styles.sideBtn, borderColor: "#333", color: "#555", marginTop: 6 }} onClick={() => setShowLog(!showLog)}>
          {showLog ? "▲" : "▼"} LOG ({character?.history?.length || 0})
        </button>
        {showLog && (
          <div style={styles.inventoryList}>
            {character?.history?.slice().reverse().map((h, i) => (
              <div key={i} style={{ ...styles.invItem, color: "#444", fontSize: 11 }}>{h}</div>
            ))}
          </div>
        )}
        <button style={{ ...styles.sideBtn, borderColor: "#4285f4", color: "#4285f4", marginTop: 6 }} onClick={() => setShowJournal(!showJournal)}>
          {showJournal ? "▲" : "▼"} JOURNAL ({journalCount})
        </button>
        {showJournal && (
          <div style={styles.journalPanel}>
            <div style={styles.journalSectionLabel}>NPCS</div>
            {journal.npcs.length === 0
              ? <div style={styles.emptyJournalText}>No important NPCs met.</div>
              : journal.npcs.map(npc => (
                <div key={npc.name} style={styles.journalEntry}>
                  <div style={styles.journalEntryHeader}>
                    <span style={styles.journalName}>{npc.name}</span>
                    <span style={{ ...styles.journalTag, color: npcTagColor(npc.tag), borderColor: npcTagColor(npc.tag) }}>{npc.tag}</span>
                  </div>
                  {(npc.role || npc.faction) && <div style={styles.journalMeta}>{[npc.role, npc.faction].filter(Boolean).join(" // ")}</div>}
                  {npc.notes && <div style={styles.journalNote}>{npc.notes}</div>}
                  {npc.lastSeen && <div style={styles.journalMeta}>Last seen: {npc.lastSeen}</div>}
                </div>
              ))}

            <div style={styles.journalSectionLabel}>PLACES</div>
            {journal.places.length === 0
              ? <div style={styles.emptyJournalText}>No places logged.</div>
              : journal.places.map(place => (
                <div key={place.name} style={styles.journalEntry}>
                  <div style={styles.journalName}>{place.name}</div>
                  {place.notes && <div style={styles.journalNote}>{place.notes}</div>}
                  {place.lastVisited && <div style={styles.journalMeta}>Visited: {place.lastVisited}</div>}
                </div>
              ))}

            <div style={styles.journalSectionLabel}>CANON</div>
            {journal.canonFacts.length === 0
              ? <div style={styles.emptyJournalText}>No locked facts yet.</div>
              : journal.canonFacts.slice(-6).map((fact, i) => <div key={i} style={styles.memoryLine}>{fact}</div>)}

            <div style={styles.journalSectionLabel}>THREADS</div>
            {journal.openThreads.length === 0
              ? <div style={styles.emptyJournalText}>No open threads.</div>
              : journal.openThreads.slice(-6).map((thread, i) => <div key={i} style={styles.memoryLine}>{thread}</div>)}
          </div>
        )}
        <div style={{ marginTop: "auto", paddingTop: 16 }}>
          <div style={{ ...styles.statLabel, marginBottom: 4 }}>ACCOUNT</div>
          <div style={{ color: "#ccc", fontSize: 12, fontFamily: "monospace", marginBottom: 4 }}>{account?.handle}</div>
          <div style={{ color: saveStatus === "SAVE FAILED" ? "#ff2d55" : "#555", fontSize: 10, fontFamily: "monospace", marginBottom: 6 }}>
            {saveStatus || formatSaveTime(lastSavedAt)}
          </div>
          <button style={{ ...styles.sideBtn, borderColor: "#333", color: "#888", width: "100%" }} onClick={handleManualSave}>
            SAVE
          </button>
          <button style={{ ...styles.sideBtn, borderColor: "#222", color: "#555", width: "100%", marginBottom: 12 }} onClick={handleLogout}>
            SIGN OUT
          </button>
          <div style={{ ...styles.statLabel, marginBottom: 4 }}>ENGINE</div>
          <div style={{ color: "#4285f4", fontSize: 11, fontFamily: "monospace" }}>Gemini 2.0 Flash</div>
        </div>
      </aside>

      <main style={styles.main}>
        <div style={styles.feedHeader}>
          <span style={{ color: arch?.color, letterSpacing: 3, fontSize: 11 }}>VOIDLINE // {CITY_NAME.toUpperCase()} // FEED ACTIVE</span>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {saveStatus && <span style={{ color: saveStatus === "SAVE FAILED" ? "#ff2d55" : "#06d6a0", fontSize: 10, fontFamily: "monospace" }}>{saveStatus}</span>}
            {apiError && <span style={{ color: "#ff2d55", fontSize: 10, fontFamily: "monospace" }}>API ERR</span>}
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#06d6a0", display: "inline-block", boxShadow: "0 0 6px #06d6a0", animation: "pulse 2s infinite" }} />
            <span style={{ color: "#555", fontSize: 11 }}>ONLINE</span>
          </div>
        </div>
        <div style={styles.feed}>
          {messages.map((msg, i) => <MessageBubble key={i} msg={msg} archColor={arch?.color} />)}
          {isLoading && <LoadingPulse color={arch?.color} />}
          <div ref={chatEndRef} />
        </div>
        <div style={styles.inputArea}>
          <div style={{ color: arch?.color, fontFamily: "monospace", fontSize: 13, marginBottom: 8, letterSpacing: 1 }}>&gt; ENTER ACTION</div>
          <div style={styles.inputRow}>
            <textarea
              ref={inputRef}
              style={{ ...styles.textarea, borderColor: input ? arch?.color : "#333" }}
              value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="What do you do? (/gm for OOC, SAVE to save)"
              rows={2} disabled={isLoading}
            />
            <button
              style={{ ...styles.sendBtn, background: arch?.color, opacity: isLoading || !input.trim() ? 0.4 : 1 }}
              onClick={sendAction} disabled={isLoading || !input.trim()}
            >⏎</button>
          </div>
        </div>
      </main>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@300;400;500;600;700&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes flicker { 0%,100%{opacity:1} 93%{opacity:.97} 95%{opacity:.9} 97%{opacity:.98} }
        * { box-sizing: border-box; margin:0; padding:0; }
        body { background: #050505; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 2px; }
        textarea::placeholder { color: #333; }
      `}</style>
    </div>
  );
}

// ─── SUB COMPONENTS ──────────────────────────────────────────────────────────

function LoginScreen({ loginName, onLoginNameChange, onLogin, error }) {
  const canLogin = loginName.trim().length >= 2;
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && canLogin) onLogin();
  };
  return (
    <div style={styles.createRoot}>
      <div style={styles.createHeader}>
        <div style={{ color: "#ff2d55", fontSize: 36, letterSpacing: 8, fontFamily: "'Share Tech Mono', monospace", animation: "flicker 4s infinite" }}>VOIDLINE</div>
        <div style={{ color: "#555", fontSize: 11, letterSpacing: 3, fontFamily: "monospace", marginTop: 6 }}>LOCAL ACCOUNT NODE</div>
      </div>
      <div style={{ maxWidth: 520, width: "100%", background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 6, padding: "20px", marginTop: 20 }}>
        <div style={{ color: "#00f5d4", fontSize: 11, fontFamily: "'Share Tech Mono', monospace", letterSpacing: 2, marginBottom: 10 }}>
          OPERATOR HANDLE
        </div>
        <input
          style={{ ...styles.nameInput, marginBottom: error ? 8 : 16, borderColor: canLogin ? "#00f5d4" : "#222" }}
          value={loginName}
          onChange={e => onLoginNameChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter local account..."
          maxLength={32}
        />
        {error && <div style={{ color: "#ff2d55", fontSize: 11, fontFamily: "monospace", marginBottom: 16 }}>{error}</div>}
        <button
          style={{ ...styles.startBtn, background: "#00f5d4", color: "#050505", opacity: canLogin ? 1 : 0.3, cursor: canLogin ? "pointer" : "not-allowed" }}
          onClick={onLogin}
          disabled={!canLogin}
        >
          LOG IN
        </button>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@300;400;500;600;700&display=swap'); @keyframes flicker { 0%,100%{opacity:1} 93%{opacity:.97} 95%{opacity:.8} 97%{opacity:.98} } * {box-sizing:border-box;margin:0;padding:0;} body{background:#050505;} input::placeholder{color:#333;}`}</style>
    </div>
  );
}

function StatBar({ label, value, max, color }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={styles.statRow}>
        <span style={styles.statLabel}>{label}</span>
        <span style={{ color, fontFamily: "monospace", fontSize: 13 }}>{value}/{max}</span>
      </div>
      <div style={styles.barTrack}>
        <div style={{ ...styles.barFill, width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}` }} />
      </div>
    </div>
  );
}

function MessageBubble({ msg, archColor }) {
  if (msg.role === "system_intro") return (
    <div style={styles.introMsg}>
      <pre style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: archColor, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{msg.content}</pre>
    </div>
  );
  if (msg.role === "death") return (
    <div style={styles.deathMsg}>
      <div style={{ color: "#ff2d55", fontSize: 18, letterSpacing: 4, marginBottom: 8 }}>YOU DIED</div>
      <div style={{ color: "#888", fontSize: 13, fontFamily: "'Share Tech Mono', monospace" }}>{msg.content}</div>
    </div>
  );
  if (msg.role === "user_ooc") return (
    <div style={styles.userMsg}>
      <span style={{ color: "#4285f4", fontFamily: "'Share Tech Mono', monospace", fontSize: 12 }}>/gm </span>
      <span style={{ color: "#9fb7ff", fontSize: 14, fontFamily: "'Rajdhani', sans-serif", letterSpacing: 0.5 }}>{msg.content}</span>
    </div>
  );
  if (msg.role === "user") return (
    <div style={styles.userMsg}>
      <span style={{ color: archColor, fontFamily: "'Share Tech Mono', monospace", fontSize: 12 }}>&gt; </span>
      <span style={{ color: "#ccc", fontSize: 14, fontFamily: "'Rajdhani', sans-serif", letterSpacing: 0.5 }}>{msg.content}</span>
    </div>
  );
  if (msg.role === "gm_ooc") return (
    <div style={{ ...styles.gmMsg, borderLeftColor: "#4285f4", background: "#050914" }}>
      <div style={{ color: "#4285f4", fontSize: 10, fontFamily: "'Share Tech Mono', monospace", letterSpacing: 2 }}>OOC GM</div>
      <p style={{ color: "#d4d4d4", fontSize: 14, lineHeight: 1.8, fontFamily: "'Rajdhani', sans-serif", fontWeight: 400, letterSpacing: 0.3 }}>{msg.content}</p>
      {msg.gmNote && <div style={styles.gmNote}>{msg.gmNote}</div>}
    </div>
  );
  if (msg.role === "gm") return (
    <div style={styles.gmMsg}>
      <p style={{ color: "#d4d4d4", fontSize: 14, lineHeight: 1.8, fontFamily: "'Rajdhani', sans-serif", fontWeight: 400, letterSpacing: 0.3 }}>{msg.content}</p>
      {(msg.deltas && Object.values(msg.deltas).some(v => v && (Array.isArray(v) ? v.length > 0 : v !== 0))) && (
        <div style={styles.deltasRow}>
          {msg.deltas.hp !== 0 && <Delta label="HP" val={msg.deltas.hp} />}
          {msg.deltas.credits !== 0 && <Delta label="¢" val={msg.deltas.credits} />}
          {msg.deltas.heat !== 0 && <Delta label="HEAT" val={msg.deltas.heat} />}
          {msg.deltas.time > 0 && <Delta label="TIME" val={msg.deltas.time} />}
          {msg.deltas.gained?.map((item, i) => <span key={i} style={{ ...styles.deltaChip, color: "#06d6a0", borderColor: "#06d6a0" }}>+{item}</span>)}
          {msg.deltas.lost?.map((item, i) => <span key={i} style={{ ...styles.deltaChip, color: "#ff2d55", borderColor: "#ff2d55" }}>-{item}</span>)}
        </div>
      )}
      {msg.gmNote && <div style={styles.gmNote}>{msg.gmNote}</div>}
    </div>
  );
  return null;
}

function Delta({ label, val }) {
  const pos = val > 0;
  const color = label === "TIME" ? "#00f5d4" : (label === "HEAT" ? (pos ? "#f77f00" : "#06d6a0") : (pos ? "#06d6a0" : "#ff2d55"));
  const displayVal = label === "TIME" ? formatDuration(val) : val;
  const prefix = pos && label !== "TIME" ? "+" : "";
  return <span style={{ ...styles.deltaChip, color, borderColor: color }}>{prefix}{displayVal} {label}</span>;
}

function LoadingPulse({ color }) {
  return (
    <div style={{ padding: "16px 0", display: "flex", gap: 6, alignItems: "center" }}>
      {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: color, animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
      <span style={{ color: "#555", fontSize: 12, fontFamily: "monospace", marginLeft: 8 }}>GM processing...</span>
    </div>
  );
}

function BootScreen({ phase }) {
  const lines = [
    "VOIDLINE OS v4.2.1 — NEURAL INTERFACE BOOT",
    "Establishing encrypted channel...",
    `Loading world matrix: ${CITY_NAME} [160+ NPCs | 100+ locations]`,
    "Faction alignment: NONE // Heat level: COLD",
    "READY. Jacking in..."
  ];
  return (
    <div style={{ background: "#050505", height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", fontFamily: "'Share Tech Mono', monospace" }}>
      <div style={{ color: "#ff2d55", fontSize: 36, letterSpacing: 8, marginBottom: 40, animation: "flicker 3s infinite" }}>VOIDLINE</div>
      {lines.slice(0, phase + 1).map((l, i) => (
        <div key={i} style={{ color: i === phase ? "#00f5d4" : "#333", fontSize: 12, letterSpacing: 2, marginBottom: 10, maxWidth: 500, textAlign: "center" }}>{l}</div>
      ))}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap'); @keyframes flicker { 0%,100%{opacity:1} 93%{opacity:.97} 95%{opacity:.8} 97%{opacity:.98} } * {box-sizing:border-box;margin:0;padding:0;} body{background:#050505;}`}</style>
    </div>
  );
}

function CharCreate({ archetypes, selected, onSelect, playerName, onNameChange, apiKey, onApiKeyChange, onStart }) {
  const arch = archetypes.find(a => a.id === selected);
  const canStart = selected && playerName.trim() && apiKey.trim().length > 10;
  return (
    <div style={styles.createRoot}>
      <div style={styles.createHeader}>
        <div style={{ color: "#ff2d55", fontSize: 28, letterSpacing: 6, fontFamily: "'Share Tech Mono', monospace", animation: "flicker 4s infinite" }}>VOIDLINE</div>
        <div style={{ color: "#555", fontSize: 11, letterSpacing: 3, fontFamily: "monospace", marginTop: 4 }}>{CITY_NAME.toUpperCase()} // CHARACTER INIT</div>
      </div>

      {/* API Key section */}
      <div style={{ maxWidth: 700, width: "100%", background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 6, padding: "16px 20px", marginBottom: 28 }}>
        <div style={{ color: "#4285f4", fontSize: 11, fontFamily: "'Share Tech Mono', monospace", letterSpacing: 2, marginBottom: 8 }}>
          00 // GOOGLE AI STUDIO API KEY
        </div>
        <input
          style={{ ...styles.nameInput, marginBottom: 8, borderColor: apiKey.length > 10 ? "#4285f4" : "#222" }}
          value={apiKey}
          onChange={e => onApiKeyChange(e.target.value)}
          placeholder="Paste your Gemini API key here (AIza...)"
          type="password"
        />
        <div style={{ color: "#444", fontSize: 11, fontFamily: "monospace", lineHeight: 1.6 }}>
          Get a free key at{" "}
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer"
            style={{ color: "#4285f4", textDecoration: "none" }}>
            aistudio.google.com/app/apikey
          </a>
          {" "}— free tier, no credit card needed.
          Your key stays in your browser only.
        </div>
      </div>

      <div style={{ color: "#888", fontSize: 12, fontFamily: "'Share Tech Mono', monospace", letterSpacing: 2, marginBottom: 20 }}>01 // SELECT ARCHETYPE</div>
      <div style={styles.archGrid}>
        {archetypes.map(a => (
          <div key={a.id} onClick={() => onSelect(a.id)}
            style={{ ...styles.archCard, borderColor: selected === a.id ? a.color : "#1a1a1a", background: selected === a.id ? `${a.color}11` : "#0a0a0a", boxShadow: selected === a.id ? `0 0 20px ${a.color}33` : "none" }}>
            <div style={{ color: a.color, fontSize: 24, marginBottom: 6 }}>{a.glyph}</div>
            <div style={{ color: selected === a.id ? a.color : "#ccc", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: 2 }}>{a.name}</div>
            <div style={{ color: "#666", fontSize: 11, fontFamily: "'Rajdhani', sans-serif", marginTop: 4 }}>{a.tagline}</div>
            {selected === a.id && (
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", justifyContent: "center" }}>
                {STAT_KEYS.map(({ key, label }) => (
                  <div key={key} style={{ textAlign: "center" }}>
                    <div style={{ color: "#555", fontSize: 9, fontFamily: "monospace" }}>{label}</div>
                    <div style={{ color: a.color, fontSize: 14, fontFamily: "monospace" }}>{a.stats[key]}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {arch && (
        <div style={styles.archDetail}>
          <div style={{ color: arch.color, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: 13, letterSpacing: 2, marginBottom: 8 }}>BACKSTORY</div>
          <p style={{ color: "#999", fontSize: 13, fontFamily: "'Rajdhani', sans-serif", lineHeight: 1.7, marginBottom: 12 }}>{arch.lore}</p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ color: "#555", fontSize: 11, fontFamily: "monospace", marginBottom: 4 }}>SKILLS</div>
              {arch.skills.map((s, i) => <div key={i} style={{ color: arch.color, fontSize: 12, fontFamily: "'Share Tech Mono', monospace" }}>◆ {s}</div>)}
            </div>
            <div>
              <div style={{ color: "#555", fontSize: 11, fontFamily: "monospace", marginBottom: 4 }}>STARTING GEAR</div>
              {arch.startingGear.map((g, i) => <div key={i} style={{ color: "#888", fontSize: 12, fontFamily: "'Share Tech Mono', monospace" }}>◈ {g}</div>)}
            </div>
          </div>
        </div>
      )}

      <div style={{ color: "#888", fontSize: 12, fontFamily: "'Share Tech Mono', monospace", letterSpacing: 2, marginBottom: 12, marginTop: 24 }}>02 // OPERATOR HANDLE</div>
      <input
        style={styles.nameInput}
        value={playerName} onChange={e => onNameChange(e.target.value)}
        placeholder="Enter your street name..." maxLength={24}
      />
      <button
        style={{ ...styles.startBtn, background: arch ? arch.color : "#333", color: "#050505", opacity: canStart ? 1 : 0.3, cursor: canStart ? "pointer" : "not-allowed" }}
        onClick={onStart} disabled={!canStart}
      >
        JACK IN →
      </button>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@300;400;500;600;700&display=swap'); @keyframes flicker { 0%,100%{opacity:1} 93%{opacity:.97} 95%{opacity:.8} 97%{opacity:.98} } * {box-sizing:border-box;margin:0;padding:0;} body{background:#050505;} input::placeholder{color:#333;}`}</style>
    </div>
  );
}

function DeathScreen({ character, turnCount, onRestart }) {
  return (
    <div style={{ background: "#050505", height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", fontFamily: "'Share Tech Mono', monospace", gap: 20 }}>
      <div style={{ color: "#ff2d55", fontSize: 48, letterSpacing: 8, animation: "flicker 2s infinite" }}>FLATLINED</div>
      <div style={{ color: "#333", fontSize: 14, letterSpacing: 2 }}>{character?.name} // {character?.archetype?.name}</div>
      <div style={{ color: "#555", fontSize: 12 }}>Survived {turnCount} turns in {CITY_NAME}</div>
      <div style={{ color: "#555", fontSize: 12 }}>Final time: {formatGameTime(character?.day, character?.clockMinutes)}</div>
      <div style={{ color: "#555", fontSize: 12 }}>Credits at death: ¢{character?.credits?.toLocaleString()}</div>
      <button onClick={onRestart} style={{ marginTop: 30, background: "transparent", border: "1px solid #ff2d55", color: "#ff2d55", padding: "12px 40px", fontFamily: "'Share Tech Mono', monospace", fontSize: 13, letterSpacing: 3, cursor: "pointer" }}>
        NEW RUN →
      </button>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap'); @keyframes flicker { 0%,100%{opacity:1} 93%{opacity:.97} 95%{opacity:.7} 97%{opacity:.98} } * {box-sizing:border-box;margin:0;padding:0;} body{background:#050505;}`}</style>
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = {
  gameRoot: { display: "flex", height: "100vh", background: "#050505", fontFamily: "'Rajdhani', sans-serif", overflow: "hidden", position: "relative" },
  scanlines: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)", pointerEvents: "none", zIndex: 999 },
  leftPanel: { width: 240, minWidth: 240, background: "#080808", borderRight: "1px solid #1a1a1a", padding: "20px 16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 },
  panelHeader: { display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid", paddingBottom: 14, marginBottom: 16 },
  charName: { color: "#fff", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: 1 },
  archLabel: { fontSize: 10, fontFamily: "'Share Tech Mono', monospace", letterSpacing: 3 },
  statRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  statLabel: { color: "#444", fontSize: 10, fontFamily: "'Share Tech Mono', monospace", letterSpacing: 2 },
  barTrack: { height: 3, background: "#111", borderRadius: 2, overflow: "hidden", marginBottom: 4 },
  barFill: { height: "100%", borderRadius: 2, transition: "width 0.5s ease, background 0.5s ease" },
  heatSection: { marginBottom: 8 },
  divider: { height: 1, background: "#111", margin: "8px 0" },
  statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 4 },
  statBox: { background: "#0e0e0e", border: "1px solid #1a1a1a", borderRadius: 4, padding: "8px", textAlign: "center" },
  statBoxLabel: { color: "#444", fontSize: 9, fontFamily: "monospace", letterSpacing: 2, marginBottom: 2 },
  statBoxVal: { fontSize: 20, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 },
  sideBtn: { background: "transparent", border: "1px solid", padding: "6px 10px", cursor: "pointer", fontFamily: "'Share Tech Mono', monospace", fontSize: 10, letterSpacing: 2, textAlign: "left", borderRadius: 2, marginTop: 4 },
  inventoryList: { padding: "8px 4px", display: "flex", flexDirection: "column", gap: 4 },
  invItem: { color: "#888", fontSize: 12, fontFamily: "'Rajdhani', sans-serif", display: "flex", alignItems: "center" },
  journalPanel: { padding: "8px 4px", display: "flex", flexDirection: "column", gap: 8 },
  journalSectionLabel: { color: "#4285f4", fontSize: 9, fontFamily: "'Share Tech Mono', monospace", letterSpacing: 2, marginTop: 4 },
  journalEntry: { background: "#0b0b0b", border: "1px solid #171717", borderRadius: 4, padding: "8px", display: "flex", flexDirection: "column", gap: 4 },
  journalEntryHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 },
  journalName: { color: "#ccc", fontSize: 12, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 },
  journalTag: { fontSize: 8, fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1, border: "1px solid", borderRadius: 2, padding: "1px 4px", whiteSpace: "nowrap" },
  journalMeta: { color: "#555", fontSize: 10, fontFamily: "monospace", lineHeight: 1.4 },
  journalNote: { color: "#888", fontSize: 11, fontFamily: "'Rajdhani', sans-serif", lineHeight: 1.4 },
  memoryLine: { color: "#777", fontSize: 11, fontFamily: "'Rajdhani', sans-serif", lineHeight: 1.4, borderLeft: "1px solid #222", paddingLeft: 6 },
  emptyJournalText: { color: "#444", fontSize: 11, fontFamily: "monospace" },
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  feedHeader: { padding: "12px 20px", borderBottom: "1px solid #111", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#070707" },
  feed: { flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 },
  introMsg: { background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 4, padding: "20px 24px" },
  userMsg: { display: "flex", gap: 4, alignItems: "flex-start", opacity: 0.7 },
  gmMsg: { background: "#0a0a0a", borderLeft: "2px solid #222", padding: "16px 20px", borderRadius: "0 4px 4px 0", display: "flex", flexDirection: "column", gap: 10 },
  deathMsg: { background: "#100505", border: "1px solid #ff2d5544", borderRadius: 4, padding: "20px 24px", textAlign: "center" },
  deltasRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  deltaChip: { fontSize: 11, fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1, border: "1px solid", borderRadius: 2, padding: "2px 8px" },
  gmNote: { color: "#444", fontSize: 11, fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1 },
  inputArea: { padding: "16px 28px 20px", borderTop: "1px solid #111", background: "#070707" },
  inputRow: { display: "flex", gap: 10, alignItems: "flex-end" },
  textarea: { flex: 1, background: "#0a0a0a", border: "1px solid", color: "#ddd", fontFamily: "'Rajdhani', sans-serif", fontSize: 14, padding: "10px 14px", resize: "none", borderRadius: 4, outline: "none", lineHeight: 1.6, transition: "border-color 0.2s" },
  sendBtn: { width: 44, height: 44, border: "none", borderRadius: 4, fontSize: 18, cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", transition: "opacity 0.2s" },
  createRoot: { minHeight: "100vh", background: "#050505", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px", overflowY: "auto" },
  createHeader: { textAlign: "center", marginBottom: 32 },
  archGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, maxWidth: 700, width: "100%", marginBottom: 12 },
  archCard: { border: "1px solid", borderRadius: 6, padding: "16px 12px", cursor: "pointer", textAlign: "center", transition: "all 0.2s" },
  archDetail: { maxWidth: 700, width: "100%", background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 6, padding: "20px", marginTop: 8 },
  nameInput: { maxWidth: 700, width: "100%", background: "#0a0a0a", border: "1px solid #222", color: "#ddd", fontFamily: "'Share Tech Mono', monospace", fontSize: 14, padding: "12px 16px", borderRadius: 4, outline: "none", marginBottom: 20, display: "block" },
  startBtn: { maxWidth: 700, width: "100%", border: "none", padding: "16px", fontFamily: "'Share Tech Mono', monospace", fontSize: 14, letterSpacing: 4, borderRadius: 4, transition: "opacity 0.2s", cursor: "pointer" }
};
