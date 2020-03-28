const connection = require("../database/connection");

module.exports = {
  async index(request, response) {
    const { page = 1 } = request.query; // Criado para pegar os dados de paginação,
    // nesse caso o da página 1

    // Conta a quantidade de casos registrados
    const [count] = await connection("incidents").count();

    const incidents = await connection("incidents")
      .join("ongs", "ongs.id", "=", "incidents.ong_id")
      .limit(5) // Limita a mostrar 5 registro de incidentes por pagina
      .offset((page - 1) * 5) // Calculo para mostrar 5 incidentes por pagina
      .select([
        "incidents.*",
        "ongs.name",
        "ongs.email",
        "ongs.whatsapp",
        "ongs.city",
        "ongs.uf"
      ]); // Select com array pq busca informação de 2 tabelas

    // Mostra a quantidade de casos no headre da resposta no insomnia
    response.header("X-Total_count", count["count(*)"]);

    return response.json(incidents);
  },

  async create(request, response) {
    const { title, description, value } = request.body;
    const ong_id = request.headers.authorization;

    const [id] = await connection("incidents").insert({
      title,
      description,
      value,
      ong_id
    });

    return response.json({ id });
  },

  async delete(request, response) {
    const { id } = request.params; // pega o id que vem no http
    const ong_id = request.headers.authorization; // pega o id da autorização

    // Verifica se o id passado na rota é igual ao criado da autorização
    const incident = await connection("incidents")
      .where("id", id)
      .select("ong_id")
      .first(); // retorna apena um unico valor

    if (incident.ong_id != ong_id) {
      return response.status(401).json({ error: "Operação não permitida." });
    }

    await connection("incidents")
      .where("id", id)
      .delete();

    return response.status(204).send();
  }
};
