function createInsightsController(service) {
  return {
    async summary(_req, res) {
      res.json(await service.getSummary());
    },
    async byCountry(_req, res) {
      res.json(await service.getByCountry());
    },
    async byDepartment(req, res) {
      res.json(await service.getByDepartment(req.query.country));
    },
    async byJobTitle(req, res) {
      res.json(await service.getByJobTitle(req.query.country));
    },
    async distribution(req, res) {
      res.json(await service.getDistribution(req.query.country));
    },
  };
}

module.exports = { createInsightsController };
