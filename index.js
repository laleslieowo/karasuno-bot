require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  REST,
  Routes,
} = require("discord.js");

// Variables de entorno
const token = process.env.TOKEN;
const staffChannels = process.env.STAFFCHANNELS
  ? process.env.STAFFCHANNELS.split(",")
  : [];

// Configurar bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Comandos
const commands = [
  { name: "shop", description: "Muestra la tienda" },
  {
    name: "give",
    description: "Da puntos manualmente",
    options: [
      {
        name: "usuario",
        description: "Usuario a quien dar puntos",
        type: 6,
        required: true,
      },
      {
        name: "cantidad",
        description: "Cantidad de puntos",
        type: 4,
        required: true,
      },
    ],
  },
];

const rest = new REST({ version: "10" }).setToken(token);
rest
  .put(
    Routes.applicationGuildCommands(
      "1453940096779681792",
      "1311854978180190259"
    ),
    { body: commands }
  )
  .then(() => console.log("Comandos registrados"))
  .catch(console.error);

client.once("ready", () => {
  console.log(`Bot conectado como ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "shop") {
    const embed = new EmbedBuilder()
      .setTitle("🏐 Tienda Karasuno")
      .setDescription("Aquí puedes comprar con tus puntos")
      .setColor(0xff7a00);

    interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === "give") {
    if (!interaction.member.permissions.has("Administrator"))
      return interaction.reply({ content: "❌ No autorizado." });

    const user = interaction.options.getUser("usuario");
    const amount = interaction.options.getInteger("cantidad");

    return interaction.reply({
      content: `✅ Se dieron ${amount} puntos a ${user.username}`,
    });
  }
});

// Login
client.login(token);

// Servidor web falso para mantener vivo en Replit
const express = require("express");
const app = express();
app.get("/", (req, res) => res.send("Bot activo!"));
app.listen(process.env.PORT || 3000, () =>
  console.log("Servidor web activo.")
);


const fs = require("fs");
const path = "./points.json"; // Archivo donde guardaremos los puntos

// Función para cargar puntos
function loadPoints() {
  if (!fs.existsSync(path)) return {};
  const data = fs.readFileSync(path, "utf8");
  return JSON.parse(data);
}

// Función para guardar puntos
function savePoints(points) {
  fs.writeFileSync(path, JSON.stringify(points, null, 2));
}

// Comando addpoints
if (interaction.commandName === "addpoints") {
  if (!interaction.member.permissions.has("Administrator")) {
    return interaction.reply({ content: "❌ No autorizado", ephemeral: true });
  }

  const user = interaction.options.getUser("usuario");
  const tipo = interaction.options.getString("tipo");
  const puntosAGanar = tipo === "mvp" ? 30 : 20;

  const pointsData = loadPoints();
  if (!pointsData[user.id]) pointsData[user.id] = 0;

  pointsData[user.id] += puntosAGanar;
  savePoints(pointsData);

  interaction.reply({ content: `✅ ${user.username} recibió **${puntosAGanar} puntos**.` });
}
