require("dotenv").config();

const express = require("express");
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");

const PORT = Number(process.env.PORT || 3000);
const API_URL = process.env.FREE_FIRE_API || "https://glob-info2.vercel.app/info";

if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
  console.error("Missing DISCORD_TOKEN or CLIENT_ID in .env");
  process.exit(1);
}

const app = express();
app.get("/", (_req, res) => res.json({
  ok: true,
  service: "Infobot",
  message: "Free Fire info API wrapper is running"
}));

app.get("/api/info", async (req, res) => {
  const uid = String(req.query.uid || "").trim();

  if (!/^\\d{5,15}$/.test(uid)) {
    return res.status(400).json({
      ok: false,
      error: "UID must contain 5-15 digits"
    });
  }

  try {
    const response = await fetch(`${API_URL}?uid=${encodeURIComponent(uid)}`);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ ok: false, upstream: data });
    }

    return res.json({ ok: true, data });
  } catch (error) {
    console.error("API error:", error);
    return res.status(502).json({
      ok: false,
      error: "Free Fire API is unavailable right now"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Health/API server listening on port ${PORT}`);
});

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const commands = [
  new SlashCommandBuilder()
    .setName("info")
    .setDescription("Get Free Fire player information")
    .addStringOption(option =>
      option.setName("uid")
        .setDescription("Free Fire UID")
        .setRequired(true)
    )
].map(command => command.toJSON());

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );

  console.log("Slash command /info registered.");
}

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);
  try {
    await registerCommands();
  } catch (error) {
    console.error("Command registration failed:", error);
  }
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== "info") return;

  const uid = interaction.options.getString("uid", true).trim();

  if (!/^\\d{5,15}$/.test(uid)) {
    return interaction.reply({
      content: "❌ UID 5-15 digits ka hona chahiye.",
      ephemeral: true
    });
  }

  await interaction.deferReply();

  try {
    const response = await fetch(`${API_URL}?uid=${encodeURIComponent(uid)}`);
    const data = await response.json();

    if (!response.ok || !data) {
      return interaction.editReply("❌ Player information fetch nahi ho paayi. UID check karke dobara try karo.");
    }

    const basic = data.basicInfo || data.basicinfo || {};
    const nickname = basic.nickname || "Unknown";
    const level = basic.level ?? "—";
    const likes = basic.liked ?? basic.likes ?? "—";
    const brRank = basic.rank ?? "—";
    const brPoints = basic.rankingPoints ?? basic.rankingpoints ?? "—";
    const csRank = basic.csRank ?? basic.csrank ?? "—";
    const csPoints = basic.csRankingPoints ?? basic.csrankingpoints ?? "—";
    const region = basic.region || "—";
    const guild = data.guildInfo || data.guildinfo || {};
    const guildName = guild.guildName || guild.guildname || guild.name || "No guild";

    const embed = new EmbedBuilder()
      .setTitle(`🔥 ${nickname}`)
      .setDescription("Free Fire Player Information")
      .addFields(
        { name: "🆔 UID", value: uid, inline: true },
        { name: "🌍 Region", value: String(region), inline: true },
        { name: "⭐ Level", value: String(level), inline: true },
        { name: "❤️ Likes", value: String(likes), inline: true },
        { name: "🏆 BR Rank", value: String(brRank), inline: true },
        { name: "📈 BR Points", value: String(brPoints), inline: true },
        { name: "🎯 CS Rank", value: String(csRank), inline: true },
        { name: "📊 CS Points", value: String(csPoints), inline: true },
        { name: "🛡️ Guild", value: String(guildName), inline: false }
      )
      .setFooter({ text: "Infobot • Data from an unofficial Free Fire API" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("Discord/API error:", error);
    await interaction.editReply("⚠️ API temporarily unavailable. Thodi der baad try karo.");
  }
});

client.login(process.env.DISCORD_TOKEN);
