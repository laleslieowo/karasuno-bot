const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  REST,
  Routes
} = require("discord.js");

const sqlite3 = require("sqlite3").verbose();
const token = process.env.TOKEN;
const staffChannels = process.env.STAFFCHANNELS
  ? process.env.STAFFCHANNELS.split(",")
  : [];


// Comandos
const commands = [
  {
    name: "shop",
    description: "Muestra la tienda de Karasuno",
  },
  {
    name: "addpoints",
    description: "Añade puntos a un usuario",
    options: [
      { name: "usuario", description: "Usuario que recibirá puntos", type: 6, required: true },
      { name: "tipo", description: "Tipo de puntos (mvp/normal)", type: 3, required: true }
    ]
  }
];

// Registrar comandos sin await
const rest = new REST({ version: "10" }).setToken(token);
rest.put(
  Routes.applicationGuildCommands("1453940096779681792", "1311854978180190259"),
  { body: commands }
)
.then(() => console.log("Comandos registrados!"))
.catch(console.error);

// Cliente Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Base de datos
const db = new sqlite3.Database("./database.sqlite");

// Crear tablas
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      userId TEXT PRIMARY KEY,
      points INTEGER DEFAULT 0,
      claimsToday INTEGER DEFAULT 0,
      lastClaim TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT,
      item TEXT,
      date TEXT
    )
  `);
});

client.once("ready", () => {
  console.log(`🖤 Bot conectado como ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {

  // ===============================
  // BOTONES DE COMPRA
  // ===============================
  if (interaction.isButton()) {
    const userId = interaction.user.id;
    const item = interaction.customId.replace("buy_", "");

    const prices = {
      cuervo_novato: 40,
      cuervo_pro: 2000,
      cuervo_leyenda: 7000,
      tiktok: 700,
      entrenamiento: 2000,
      robux: 9000
    };

    const price = prices[item];

    db.get("SELECT points FROM users WHERE userId = ?", [userId], (err, row) => {
      if (err) return console.error(err);

      if (!row || row.points < price) {
        return interaction.reply({
          content: "❌ No tienes puntos suficientes.",
          ephemeral: true
        });
      }

      db.run("UPDATE users SET points = points - ? WHERE userId = ?", [price, userId]);
      db.run("INSERT INTO purchases (userId, item, date) VALUES (?, ?, ?)", [userId, item, new Date().toISOString()]);

      staffChannels.forEach(channelId => {
        const logChannel = client.channels.cache.get(channelId);
        if (!logChannel) return;

        const logEmbed = new EmbedBuilder()
          .setTitle("📝 Nueva compra realizada")
          .setColor(0xFF7A00)
          .addFields(
            { name: "Usuario", value: `<@${userId}>`, inline: true },
            { name: "Item comprado", value: `${item}`, inline: true },
            { name: "Precio", value: `${price} puntos`, inline: true },
            { name: "Fecha", value: `${new Date().toLocaleString()}`, inline: false }
          );

        logChannel.send({ embeds: [logEmbed] });
      });

      interaction.reply({ content: `✅ Compra realizada: ${item} por ${price} puntos.`, ephemeral: true });
    });
    return;
  }

  // ===============================
  // COMANDOS SLASH
  // ===============================
  if (!interaction.isChatInputCommand()) return;

  // 1️⃣ ADDPOINTS
  if (interaction.commandName === "addpoints") {
    if (!interaction.member.permissions.has("Administrator")) {
      return interaction.reply({ content: "❌ No autorizado", ephemeral: true });
    }

    const user = interaction.options.getUser("usuario");
    const tipo = interaction.options.getString("tipo");
    const puntos = tipo === "mvp" ? 30 : 20;

    db.get("SELECT * FROM users WHERE userId = ?", [user.id], (err, row) => {
      if (err) return console.error(err);

      const today = new Date().toISOString().split("T")[0];
      const maxClaimsPerDay = 6;

      if (!row) {
        db.run(
          "INSERT INTO users (userId, points, claimsToday, lastClaim) VALUES (?, ?, ?, ?)",
          [user.id, puntos, 1, today]
        );
      } else {
        let newClaims = row.claimsToday;
        if (row.lastClaim !== today) newClaims = 0;

        if (newClaims >= maxClaimsPerDay) {
          return interaction.reply({ content: `❌ Ya alcanzaste el máximo de ${maxClaimsPerDay} puntos hoy.`, ephemeral: true });
        }

        db.run(
          "UPDATE users SET points = points + ?, claimsToday = ?, lastClaim = ? WHERE userId = ?",
          [puntos, newClaims + 1, today, user.id]
        );
      }

      interaction.reply({ content: `✅ ${user.username} recibió **${puntos} puntos**.` });
    });
    return;
  }

  // 2️⃣ SHOP
  if (interaction.commandName === "shop") {
    const embed = new EmbedBuilder()
      .setTitle("🏐🔥 Tienda Karasuno")
      .setDescription("Canjea tus puntos por premios exclusivos 🐦‍⬛")
      .setColor(0xFF7A00)
      .setImage("https://i.pinimg.com/originals/51/2f/21/512f21d0ddb81109514fe407a59c841c.gif")
      .setFooter({ text: "🐦‍⬛ Karasuno • Volleyball Legends" })
      .addFields(
        { name: "🎖️ Titulos", value: "🐦‍⬛ Cuervo Novato – 40 pts\n🔥 Cuervo Pro – 2,000 pts\n👑 Cuervo Leyenda – 7,000 pts" },
        { name: "🎥 Tiktok", value: "Participa en un TikTok del clan – 700 pts" },
        { name: "🏐 Entrena con el staff", value: "Entrenamiento con staff – 2,000 pts" },
        { name: "💰 Robux", value: "200 Robux – 9,000 pts" }
      );

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("buy_cuervo_novato").setLabel("Cuervo Novato").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("buy_cuervo_pro").setLabel("Cuervo Pro").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("buy_cuervo_leyenda").setLabel("Cuervo Leyenda").setStyle(ButtonStyle.Success)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("buy_tiktok").setLabel("TikTok").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("buy_entrenamiento").setLabel("Entrenamiento").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("buy_robux").setLabel("200 Robux").setStyle(ButtonStyle.Primary)
    );

    interaction.reply({ embeds: [embed], components: [row1, row2] });
    return;
  }
});

client.login(token);

