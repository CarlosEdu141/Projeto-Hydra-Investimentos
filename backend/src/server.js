const app = require("./app");
const db = require('./config/database.js');
const PORT = 3333;

app.listen(PORT, () => {
  console.log(`🔥 Server rodando na porta, link para o servidor:http://localhost:3333/health ${PORT}`);
});

db.query('SELECT 1')
  .then(() => console.log('Postgre respondendo 👌'))
  .catch(err => console.error('Erro no Postgre', err));

