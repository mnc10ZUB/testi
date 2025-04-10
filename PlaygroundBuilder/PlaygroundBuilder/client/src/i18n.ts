import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
  de: {
    translation: {
      // General
      'app.title': 'ZUB Carpool Brandenburg',
      'app.language': 'DE',
      
      // Navigation
      'nav.calendar': 'Kalender',
      'nav.vehicles': 'Fahrzeuge',
      'nav.users': 'Benutzer',
      'nav.settings': 'Einstellungen',
      
      // Calendar view
      'calendar.time': 'Zeit',
      'calendar.today': 'Heute',
      'calendar.day': 'Tag',
      'calendar.week': 'Woche',
      'calendar.month': 'Monat',
      'calendar.newReservation': 'Neue Reservierung',
      'calendar.vehicle': 'Fahrzeug',
      'calendar.selectVehicle': 'Fahrzeug auswählen',
      'calendar.previous': 'Zurück',
      'calendar.next': 'Weiter',
      'calendar.rightClickToDelete': 'Rechtsklick zum Löschen',
      
      // Reservation form
      'reservation.title': 'Neue Reservierung',
      'reservation.edit': 'Reservierung Bearbeiten',
      'reservation.name': 'Name',
      'reservation.reason': 'Grund der Reservierung',
      'reservation.vehicle': 'Fahrzeug',
      'reservation.startTime': 'Startzeit',
      'reservation.endTime': 'Endzeit',
      'reservation.notes': 'Anmerkungen',
      'reservation.save': 'Reservierung speichern',
      'reservation.cancel': 'Abbrechen',
      'reservation.delete': 'Löschen',
      'reservation.required': '*',
      'reservation.notesPlaceholder': 'Zusätzliche Informationen...',
      'reservation.reasonPlaceholder': 'z.B. Kundenbesuch, Lieferung',
      'reservation.namePlaceholder': 'Name eingeben',
      'reservation.selectVehicle': 'Fahrzeug auswählen',
      
      // Confirmation dialog
      'confirm.deleteTitle': 'Reservierung löschen',
      'confirm.deleteMessage': 'Sind Sie sicher, dass Sie diese Reservierung löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.',
      'confirm.cancel': 'Abbrechen',
      'confirm.delete': 'Löschen',
      
      // Vehicles management
      'vehicles.title': 'Fahrzeugverwaltung',
      'vehicles.name': 'Name',
      'vehicles.licensePlate': 'Kennzeichen',
      'vehicles.description': 'Beschreibung',
      'vehicles.color': 'Farbe',
      'vehicles.colorHelp': 'Wählen Sie eine Farbe für die Darstellung im Kalender',
      'vehicles.status': 'Status',
      'vehicles.actions': 'Aktionen',
      'vehicles.add': 'Fahrzeug hinzufügen',
      'vehicles.edit': 'Bearbeiten',
      'vehicles.delete': 'Löschen',
      'vehicles.active': 'Aktiv',
      'vehicles.inactive': 'Inaktiv',
      
      // Error messages
      'error.overlap': 'Dieses Fahrzeug ist im ausgewählten Zeitraum bereits reserviert',
      'error.invalidVehicle': 'Ungültiges Fahrzeug',
      'error.invalidDate': 'Ungültiges Datum',
      'error.required': 'Dieses Feld ist erforderlich',
      'error.endBeforeStart': 'Die Endzeit muss nach der Startzeit liegen',
      'error.pastDate': 'Das Datum kann nicht in der Vergangenheit liegen',
      
      // Success messages
      'success.created': 'Erfolgreich erstellt',
      'success.updated': 'Erfolgreich aktualisiert',
      'success.deleted': 'Erfolgreich gelöscht',
      
      // Admin
      'admin.title': 'Administration',
      'admin.users': 'Benutzerverwaltung',
      'admin.vehicles': 'Fahrzeugverwaltung',
      'admin.reservations': 'Reservierungsverwaltung'
    }
  },
  en: {
    translation: {
      // General
      'app.title': 'ZUB Carpool Brandenburg',
      'app.language': 'EN',
      
      // Navigation
      'nav.calendar': 'Calendar',
      'nav.vehicles': 'Vehicles',
      'nav.users': 'Users',
      'nav.settings': 'Settings',
      
      // Calendar view
      'calendar.time': 'Time',
      'calendar.today': 'Today',
      'calendar.day': 'Day',
      'calendar.week': 'Week',
      'calendar.month': 'Month',
      'calendar.newReservation': 'New Reservation',
      'calendar.vehicle': 'Vehicle',
      'calendar.selectVehicle': 'Select a vehicle',
      'calendar.previous': 'Previous',
      'calendar.next': 'Next',
      'calendar.rightClickToDelete': 'Right-click to delete',
      
      // Reservation form
      'reservation.title': 'New Reservation',
      'reservation.edit': 'Edit Reservation',
      'reservation.name': 'Name',
      'reservation.reason': 'Reason for Reservation',
      'reservation.vehicle': 'Vehicle',
      'reservation.startTime': 'Start Time',
      'reservation.endTime': 'End Time',
      'reservation.notes': 'Notes',
      'reservation.save': 'Save Reservation',
      'reservation.cancel': 'Cancel',
      'reservation.delete': 'Delete',
      'reservation.required': '*',
      'reservation.notesPlaceholder': 'Additional information...',
      'reservation.reasonPlaceholder': 'e.g. Customer visit, Delivery',
      'reservation.namePlaceholder': 'Enter name',
      'reservation.selectVehicle': 'Select a vehicle',
      
      // Confirmation dialog
      'confirm.deleteTitle': 'Delete Reservation',
      'confirm.deleteMessage': 'Are you sure you want to delete this reservation? This action cannot be undone.',
      'confirm.cancel': 'Cancel',
      'confirm.delete': 'Delete',
      
      // Vehicles management
      'vehicles.title': 'Vehicle Management',
      'vehicles.name': 'Name',
      'vehicles.licensePlate': 'License Plate',
      'vehicles.description': 'Description',
      'vehicles.color': 'Color',
      'vehicles.colorHelp': 'Choose a color for calendar display',
      'vehicles.status': 'Status',
      'vehicles.actions': 'Actions',
      'vehicles.add': 'Add Vehicle',
      'vehicles.edit': 'Edit',
      'vehicles.delete': 'Delete',
      'vehicles.active': 'Active',
      'vehicles.inactive': 'Inactive',
      
      // Error messages
      'error.overlap': 'This vehicle is already reserved during the selected time period',
      'error.invalidVehicle': 'Invalid vehicle',
      'error.invalidDate': 'Invalid date',
      'error.required': 'This field is required',
      'error.endBeforeStart': 'End time must be after start time',
      'error.pastDate': 'Date cannot be in the past',
      
      // Success messages
      'success.created': 'Successfully created',
      'success.updated': 'Successfully updated',
      'success.deleted': 'Successfully deleted',
      
      // Admin
      'admin.title': 'Administration',
      'admin.users': 'User Management',
      'admin.vehicles': 'Vehicle Management',
      'admin.reservations': 'Reservation Management'
    }
  }
};

// Initialize i18next
i18n
  .use(initReactI18next)
  .use(LanguageDetector) // Add language detector
  .init({
    resources,
    lng: 'de', // Default language
    fallbackLng: 'en',
    detection: {
      order: ['navigator', 'localStorage', 'htmlTag'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false, // React already escapes values
    }
  });

export default i18n;
