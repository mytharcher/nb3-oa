export default {
  knowledge: {
    notifications: {
      title: 'Richtliniendokument aktualisiert',
      body: 'Für ein verknüpftes Richtliniendokument liegt eine neue Version vor. Öffnen Sie es, um die aktuelle Version zu lesen.',
    },
    authz: {
      knowledgeDocuments: 'Wissensdokumente',
      knowledgeFolders: 'Wissensordner',
      knowledgeVersions: 'Dokumentversionen',
      view: 'Anzeigen',
      manage: 'Verwalten',
    },
    errors: {
      ACCESS_DENIED:
        'Sie können auf dieses Dokument oder diesen Vorgang nicht zugreifen.',
      DOCUMENT_NOT_FOUND:
        'Das Dokument ist nicht vorhanden oder nicht zugänglich.',
      FOLDER_NOT_FOUND: 'Der Ordner ist nicht vorhanden oder nicht zugänglich.',
      INVALID_INPUT: 'Ungültige Dokumenteingabe.',
      INVALID_CONTENT: 'Ungültiger Dokumentinhalt.',
      INVALID_AUDIENCE:
        'Die Zielgruppe enthält eine nicht verfügbare Abteilung oder Rolle.',
      INVALID_FILE: 'Die Datei ist ungültig oder nicht verfügbar.',
      VERSION_CONFLICT:
        'Das Dokument wurde aktualisiert. Aktualisieren Sie die Ansicht und versuchen Sie es erneut.',
      COMMAND_CONFLICT:
        'Der Anfrageschlüssel wurde bereits für andere Inhalte verwendet.',
      FOLDER_CYCLE: 'Ein Ordner kann nicht in sich selbst verschoben werden.',
      TREE_UNINITIALIZED: 'Das Dokumentverzeichnis wurde nicht initialisiert.',
      BODY_TOO_LARGE:
        'Die hochgeladene Datei überschreitet die zulässige Größe.',
    },
  },
};
