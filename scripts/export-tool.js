import JSZip from "jszip";
import { saveAs } from "file-saver";

Hooks.on("renderCompendiumDirectory", (app, html) => {
  const btn = $(`<button class="export-compendium"><i class="fas fa-file-export"></i> Exportar Compêndios</button>`);
  html.find(".directory-footer").append(btn);
  btn.on("click", () => new ExportCompendiumDialog().render(true));
});

class ExportCompendiumDialog extends FormApplication {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "export-compendium-dialog",
      title: "Exportar Compêndios",
      template: "modules/export-compendium-tool/templates/export-ui.html",
      width: 400
    });
  }

  getData() {
    return { packs: Array.from(game.packs).map(([key, p]) => ({ key, label: p.metadata.label })) };
  }

  async _updateObject(event, formData) {
    const selected = Object.entries(formData).filter(([k, v]) => v).map(([k]) => k);
    if (!selected.length) return ui.notifications.warn("Nenhum compêndio selecionado.");
    ui.notifications.info(`Exportando ${selected.length} compêndio(s)...`);
    const zip = new JSZip();
    for (const packKey of selected) {
      const pack = game.packs.get(packKey);
      const docs = await pack.getDocuments();
      const content = docs.map(d => JSON.stringify(d.toCompendium())).join("\n");
      const dbName = `${pack.metadata.name}.db`;
      zip.file(`packs/${dbName}`, content);
    }
    zip.file("module.json", JSON.stringify({
      name: "exported-compendiums",
      title: "Exported Compendiums",
      description: "Exported from Foundry v13",
      version: "1.0.0",
      minimumCoreVersion: "13",
      compatibleCoreVersion: "13",
      system: game.system.id,
      packs: selected.map(k => {
        const p = game.packs.get(k);
        return { name: p.metadata.name, label: p.metadata.label, path: `packs/${p.metadata.name}.db`, entity: p.documentName };
      })
    }, null, 2));
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "exported-compendiums.zip");
    ui.notifications.info("Exportação concluída!");
  }
}
