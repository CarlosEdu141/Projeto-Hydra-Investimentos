const app = require("./app");
const db = require('./config/database.js');

const PORT = 3333;

app.listen(PORT, () => {
  console.log(`🔥 Server rodando em: http://localhost:${PORT}`);
});

// testa conexão com banco
db.query('SELECT 1')
  .then(() => console.log('PostgreSQL respondendo 👌'))
  .catch(err => console.error('Erro no PostgreSQL', err));