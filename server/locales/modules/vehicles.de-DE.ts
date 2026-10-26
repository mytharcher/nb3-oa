export default {
  vehicles: {
    authz: {
      requests: 'Fahrzeuganträge',
      garage: 'Fuhrpark',
      manage: 'Fahrzeugliste verwalten',
      viewCost: 'Vertrauliche Kraftstoffkosten anzeigen',
    },
    errors: {
      VEHICLE_SORT_LIMIT:
        'Grenzen Sie die Suche ein, bevor Sie so viele Datensätze sortieren.',
      VEHICLE_ACCESS_DENIED:
        'Die Fahreraktualisierung liegt außerhalb der gewährten Richtlinie.',
      VEHICLE_ALREADY_DISPATCHED:
        'Diese Quelle hat bereits einen unveränderlichen Einsatznachweis.',
      VEHICLE_APPROVAL_REFUSED:
        'Der Fahrzeugvorgang ist nicht verfügbar. Aktualisieren Sie den Antrag und prüfen Sie Ihre Berechtigung.',
      VEHICLE_CONTENT_CHANGED:
        'Der Einsatz erfordert unveränderte genehmigte Inhalte und die vertraulichen Aktionsdaten.',
      VEHICLE_COST_NOT_FOUND: 'Die Nutzungskosten sind nicht lesbar.',
      VEHICLE_DISPATCH_NOT_OFFERED:
        'Eine tatsächlich zulässige Einsatzaufgabe ist erforderlich.',
      VEHICLE_DRIVER_INACTIVE: 'Der Fahrer ist derzeit nicht geeignet.',
      VEHICLE_DRIVER_REQUIRED:
        'Die Fahrerauswahl muss mit dem genehmigten Antrag übereinstimmen.',
      VEHICLE_EMPLOYEE_INACTIVE:
        'Ein aktiver Mitarbeiterdatensatz ist erforderlich.',
      VEHICLE_FIELDS_RESTRICTED:
        'Für die Genehmigungsschnittstelle sind vollständige nichtfinanzielle Antragsfelder erforderlich.',
      VEHICLE_GARAGE_DENIED:
        'Ein aktives Mitglied mit Verwaltungsfunktion ist erforderlich.',
      VEHICLE_INTERVAL_CONFLICT:
        'Das Fahrzeug oder der Fahrer ist in diesem Zeitraum bereits eingesetzt.',
      VEHICLE_INVALID_COMMAND:
        'Eine Quelle und ein beständiger Anfrageschlüssel sind erforderlich.',
      VEHICLE_INVALID_INPUT:
        'Geben Sie die Fahrzeugkennung, eine positive Kapazität und einen gültigen Status an.',
      VEHICLE_INVALID_INTERVAL:
        'Geben Sie einen zeitlich geordneten Zeitraum und eine positive Fahrgastzahl an.',
      VEHICLE_INVALID_USAGE:
        'Kilometerstand und Kraftstoff müssen exakte nicht negative Ganzzahlen sein.',
      VEHICLE_INVALID_VERSION:
        'Die gespeicherte Version kann nicht fortgeschrieben werden.',
      VEHICLE_NOT_DISPATCHED:
        'Für diesen Antrag besteht kein tatsächlicher Einsatz.',
      VEHICLE_NOT_FOUND: 'Fahrzeug oder Fahrer nicht gefunden.',
      VEHICLE_NO_AVAILABLE_CAPACITY:
        'Kein aktuelles Fahrzeug hat in diesem Zeitraum genügend Kapazität. Die Einreichung reserviert kein Fahrzeug.',
      VEHICLE_OUTSTANDING_USE:
        'Schließen Sie die tatsächliche Nutzung ab, bevor Sie diesen Fahrer deaktivieren.',
      VEHICLE_PRIVATE_INPUT_REQUIRED:
        'Fachliche Ausführungsdaten müssen die vertrauliche Schnittstelle verwenden.',
      VEHICLE_REQUEST_KEY_REQUIRED:
        'Ein beständiger Anfrageschlüssel ist erforderlich.',
      VEHICLE_REQUEST_REUSED:
        'Dieser Anfrageschlüssel ist mit einem anderen Bearbeiter oder anderen Daten verknüpft.',
      VEHICLE_SLA_UNSUPPORTED:
        'Diese Version erfordert die standardmäßigen Genehmigungsfristen in Arbeitsstunden.',
      VEHICLE_SOURCE_DENIED:
        'Ein tatsächlich zulässiger Genehmigungsvorgang innerhalb seiner Transaktion ist erforderlich.',
      VEHICLE_SOURCE_MISMATCH:
        'Der Befehl stimmt nicht mit seiner Genehmigungsquelle überein.',
      VEHICLE_SOURCE_UNAVAILABLE:
        'Der tatsächliche Adapter der Genehmigungsquelle ist nicht verfügbar.',
      VEHICLE_TARGET_MISMATCH:
        'Das Aktionsziel gehört zu einem anderen Antrag.',
      VEHICLE_TYPE_INACTIVE: 'Wählen Sie eine aktive Fahrzeugart.',
      VEHICLE_UNAVAILABLE:
        'Wählen Sie ein aktives Fahrzeug mit ausreichender Kapazität.',
      VEHICLE_USAGE_OWNER:
        'Nur der tatsächliche Antragsteller darf die Nutzung erfassen.',
      VEHICLE_VERSION_CONFLICT: 'Laden Sie die aktuelle Fahrzeugversion.',
    },
  },
};
