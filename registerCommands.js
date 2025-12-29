const { REST, Routes } = require("discord.js");
const { token } = require("./config.json");

const commands = [
  {
    name: "shop",
    description: "Muestra la tienda de Karasuno",
    options: []
  },
  {
    name: "addpoints",
    description: "Añade puntos a un usuario",
    options: [
      { name: "usuario", description: "El usuario que recibirá puntos", type: 6, required: true },
      { name: "tipo", description: "Tipo de puntos", type: 3, required: true,
        choices: [
          { name: "MVP (30 pts)", value: "mvp" },
          { name: "Normal (20 pts)", value: "normal" }
        ]
      }
    ]
  }
];

const rest = new REST({ version: "10" }).setToken(token);

const serverIds = ["1311854978180190259", "1135705897902022686"]; // <- tus dos servidores

(async () => {
  try {
    console.log("🚀 Registrando comandos en los servidores...");
    for (const guildId of serverIds) {
      await rest.put(
        Routes.applicationGuildCommands("1453940096779681792", guildId),
        { body: commands }
      );
      console.log(`✅ Comandos registrados en servidor ${guildId}`);
    }
  } catch (error) {
    console.error(error);
  }
})();
