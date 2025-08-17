const express = require("express");
const router = express.Router();
const inv = require("../controllers/inventory");
const prod = require("../controllers/products");
const batch = require("../controllers/batch");
const importer = require("../utils/importer");
const analytics = require("../controllers/analytics");

router.get("/inventory/:type", inv.list);
router.post("/inventory/:type", inv.create);
router.put("/inventory/:type/:id", inv.update);

router.get("/products", prod.list);
router.post("/products", prod.create);
router.put("/products/:id", prod.update);
router.get("/products/:id/recipe", prod.recipe);
router.post("/products/:id/recipe", prod.upsertRecipe);
router.delete("/products/:id/recipe/:itemId", prod.deleteRecipeItem);
router.put("/products/:id/recipe/:itemId", prod.updateRecipeItem);
router.post("/products/:id/recipe/:itemId/replace", prod.replaceRecipeItem);

router.get("/products/:id/variants", prod.variants);
router.post("/products/:id/variants", prod.createVariant);
router.put("/products/variants/:variantId", prod.updateVariant);
router.post("/products/variants/:variantId/packaging", prod.mapVariantPackaging);
router.get("/products/variants/:variantId/packaging", prod.getVariantPackaging);

router.get("/products/:id/cost", prod.cost);
router.get("/pricing/summary", prod.pricingSummary);

router.get("/batches", batch.list);
router.post("/batches", batch.create);

router.post("/import/:type", importer.handleUpload);

router.get("/analytics/top-products", analytics.topProducts);
router.get("/analytics/top-usage", analytics.topUsage);
router.get("/analytics/forecast", analytics.forecast);

module.exports = router;