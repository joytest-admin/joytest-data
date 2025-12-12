/**
 * Translation system for doctor frontend
 * Manages translations for cs-CZ and en-US languages
 */

export type LanguageCode = 'cs-CZ' | 'en-US';

export interface Translations {
  // Header
  header: {
    title: string;
    buyTests: string;
    login: string;
    logout: string;
    testResults: string;
    settings: string;
    newTest: string;
    newReport: string;
    languageSwitched: string;
    languageSwitchedMessage: string;
    reloadPage: string;
    dismiss: string;
    feedback: string;
  };

  // Pages
  pages: {
    backToForm: string;
    backToList: string;
      testResults: {
        title: string;
        subtitle: string;
        filters: string;
        clearFilters: string;
        search: string;
        searchPlaceholder: string;
        city: string;
        cityPlaceholder: string;
        startDate: string;
        endDate: string;
        showing: string;
        of: string;
        results: string;
        page: string;
        ofPages: string;
        total: string;
        loading: string;
        noResults: string;
        exportAll: string;
        exporting: string;
        exportByPatient: string;
        exportByPatientTitle: string;
        selectPatient: string;
        downloadCsv: string;
        edit: string;
        previous: string;
        next: string;
        dateCreated: string;
        testType: string;
        pathogen: string;
        patient: string;
        yearOfBirth: string;
        action: string;
        charts: {
          positiveNegative: string;
          positive: string;
          negative: string;
          loading: string;
          noData: string;
          positiveByAgeGroups: string;
          age0to5: string;
          age6to14: string;
          age15to24: string;
          age25to64: string;
          age65plus: string;
          positiveByPathogens: string;
          pathogen: string;
          positiveTrends: string;
          total: string;
          day: string;
          week: string;
          month: string;
          allDoctors: string;
          onlyMine: string;
          allCzechRepublic: string;
          entireRegion: string;
          selectRegion: string;
          selectCity: string;
          region: string;
          city: string;
          pathogenDistribution: string;
          pathogensByAgeGroups: string;
          me: string;
          district: string;
          country: string;
          comparison: string;
        };
      };
      settings: {
        title: string;
        subtitle: string;
        profileSettings: string;
        feedback: string;
        feedbackDescription: string;
        feedbackList: string;
        email: string;
        emailRequired: string;
        emailHelp: string;
        emailPlaceholder: string;
        city: string;
        cityRequired: string;
        cityPlaceholder: string;
        passwordLogin: string;
        passwordLoginHelp: string;
        newPassword: string;
        confirmPassword: string;
        passwordPlaceholder: string;
        passwordHelp: string;
        uniqueLink: string;
        uniqueLinkHelp: string;
        save: string;
        saving: string;
        saved: string;
        saveError: string;
        cityRequiredError: string;
        emailRequiredError: string;
        passwordMinLengthError: string;
        passwordMismatchError: string;
      };
      feedback: {
        title: string;
        subtitle: string;
        newFeedback: string;
        submitFirstFeedback: string;
        loading: string;
        loadError: string;
        noFeedback: string;
        adminResponse: string;
        statusNew: string;
        statusInProgress: string;
        statusResolved: string;
        statusClosed: string;
        categoryBug: string;
        categoryFeatureRequest: string;
        categoryQuestion: string;
        categoryOther: string;
        submitNewTest: string;
        modal: {
          title: string;
          category: string;
          categoryRequired: string;
          subject: string;
          subjectRequired: string;
          subjectPlaceholder: string;
          message: string;
          messageRequired: string;
          messagePlaceholder: string;
          cancel: string;
          submit: string;
          submitting: string;
          submitted: string;
          close: string;
          subjectRequiredError: string;
          messageRequiredError: string;
          submitError: string;
          submitSuccess: string;
        };
      };
    };

  // Auth page (when not signed in)
  auth: {
    title: string;
    description: string;
    haveAccount: {
      title: string;
      description: string;
      button: string;
    };
    noAccount: {
      title: string;
      description: string;
      button: string;
    };
    uniqueLink: {
      title: string;
      description: string;
    };
    login: {
      title: string;
      description: string;
      email: string;
      password: string;
      submit: string;
      submitting: string;
      invalidCredentials: string;
      invalidCredentialsContact: string;
      contactEmail: string;
      contactPhone: string;
      loginFailed: string;
    };
  };

  // Main form
  form: {
    testType: string;
    testTypeRequired: string;
    result: string;
    resultRequired: string;
    resultPositive: string;
    resultNegative: string;
    resultInvalid: string;
    pathogen: string;
    pathogenRequired: string;
    pathogenHelp: string;
    pathogenSelectFirst: string;
    pathogenNoneAvailable: string;
    yearOfBirth: string;
    yearOfBirthRequired: string;
    yearOfBirthPlaceholder: string;
    testDate: string;
    testDateRequired: string;
    city: string;
    cityRequired: string;
    cityPlaceholder: string;
    icpNumber: string;
    icpNumberRequired: string;
    patientIdentifier: string;
    patientIdentifierOptional: string;
    patientIdentifierTooltip: string;
    patientIdentifierPlaceholder: string;
    patientIdentifierAriaLabel: string;
    patientSearchFailed: string;
    patientCreateFailed: string;
    patientIdentifierRequired: string;
    patientCreating: string;
    patientCreate: string;
    patientCreateNew: string;
    patientNoteOptional: string;
    patientYearOfBirthOptional: string;
    patientClearSelection: string;
    patientSearching: string;
    patientYearLabel: string;
    patientCreated: string;
    patientPressEnter: string;
    symptoms: string;
    symptomsRequired: string;
    symptomsHelp: string;
    temperature: string;
    temperatureRange: string;
    temperaturePlaceholder: string;
    vaccination: string;
    vaccinationOptional: string;
    vaccinations: string;
    addVaccination: string;
    removeVaccination: string;
    vaccineName: string;
    vaccineNamePlaceholder: string;
    batchNumber: string;
    batchNumberPlaceholder: string;
    vaccinationDate: string;
    vaccinationDatePlaceholder: string;
    notes: string;
    notesPlaceholder: string;
    additionalInfo: string;
    sari: string;
    atb: string;
    antivirals: string;
    obesity: string;
    respiratorySupport: string;
    ecmo: string;
    pregnancy: string;
    trimester: string;
    trimesterFirst: string;
    trimesterSecond: string;
    trimesterThird: string;
    submit: string;
    submitting: string;
    saving: string;
    saveChanges: string;
    success: string;
    successEdit: string;
    error: string;
    errorEdit: string;
    validating: string;
    authorized: string;
    selectOption: string;
    sendFeedback: string;
    // Validation errors
    testTypeRequiredError: string;
    resultRequiredError: string;
    yearOfBirthRequiredError: string;
    cityRequiredError: string;
    testDateRequiredError: string;
    pathogenRequiredError: string;
    symptomsRequiredError: string;
    icpNotAvailableError: string;
    invalidLinkError: string;
  };
}

export const translations: Record<LanguageCode, Translations> = {
  'cs-CZ': {
    header: {
      title: 'Hlášení výsledků IVD testů pro osobní i statistické účely',
      buyTests: 'Zakoupit testy',
      login: 'Přihlásit se',
      logout: 'Odhlásit se',
      testResults: 'Výsledky testů',
      settings: 'Nastavení',
      newTest: 'Nový test',
      newReport: 'Nové hlášení',
      languageSwitched: 'Jazyk změněn',
      languageSwitchedMessage: 'Některá data (např. typy testů, příznaky) se přeloží až po obnovení stránky.',
      reloadPage: 'Obnovit stránku',
      dismiss: 'Zavřít',
      feedback: 'Zpětná vazba',
    },
    pages: {
      backToForm: 'Zpět na formulář',
      backToList: 'Zpět na seznam',
      testResults: {
        title: 'Výsledky testů',
        subtitle: 'Přehled všech vašich zadaných výsledků testů',
        filters: 'Filtry',
        clearFilters: 'Vymazat filtry',
        search: 'Vyhledávání',
        searchPlaceholder: 'Hledat podle města, typu testu, patogenu, pacienta...',
        city: 'Město',
        cityPlaceholder: 'Filtrovat podle města...',
        startDate: 'Počáteční datum',
        endDate: 'Koncové datum',
        showing: 'Zobrazeno:',
        of: 'z',
        results: 'výsledků',
        page: 'strana',
        ofPages: 'z',
        total: 'celkem',
        loading: 'Načítání...',
        noResults: 'Žádné výsledky testů nenalezeny',
        exportAll: 'Stáhnout CSV (všechny výsledky)',
        exporting: 'Exportuji...',
        exportByPatient: 'Export podle pacienta',
        exportByPatientTitle: 'Export podle pacienta',
        selectPatient: 'Vyberte prosím pacienta',
        downloadCsv: 'Stáhnout CSV',
        edit: 'Upravit',
        previous: 'Předchozí',
        next: 'Další',
        dateCreated: 'Datum vytvoření',
        testType: 'Typ testu',
        pathogen: 'Patogen',
        patient: 'Pacient',
        yearOfBirth: 'Ročník narození',
        action: 'Akce',
        charts: {
          positiveNegative: 'Pozitivní vs Negativní',
          positive: 'Pozitivní',
          negative: 'Negativní',
          loading: 'Načítání...',
          noData: 'Žádná data',
          positiveByAgeGroups: 'Pozitivní testy podle věkových skupin',
          age0to5: '0 - 5 let',
          age6to14: '6 - 14 let',
          age15to24: '15 - 24 let',
          age25to64: '25 - 64 let',
          age65plus: '65+ let',
          positiveByPathogens: 'Pozitivní testy podle patogenů',
          pathogen: 'Patogen',
          positiveTrends: 'Trend pozitivních testů podle patogenů',
          total: 'Celkem',
          day: 'Dny',
          week: 'Týdny',
          month: 'Měsíce',
          allDoctors: 'Všichni doktoři',
          onlyMine: 'Jen moje',
          allCzechRepublic: 'Celá ČR',
          entireRegion: 'Celý kraj',
          selectRegion: 'Vyberte region',
          selectCity: 'Vyberte město',
          region: 'Region',
          city: 'Město',
          pathogenDistribution: 'Rozložení pozitivních patogenů',
          pathogensByAgeGroups: 'Pozitivní patogeny podle věkových skupin (celá ČR)',
          me: 'Já',
          district: 'Okres',
          country: 'Stát',
          comparison: 'Srovnání s kolegy',
        },
      },
      settings: {
        title: 'Nastavení profilu',
        subtitle: 'Spravujte přihlašování a kontaktní údaje',
        profileSettings: 'Nastavení profilu',
        feedback: 'Zpětná vazba',
        feedbackDescription: 'Máte dotaz, problém nebo návrh na zlepšení? Odeslat zpětnou vazbu můžete přímo zde nebo na stránce se seznamem požadavků.',
        feedbackList: 'Seznam požadavků',
        email: 'E-mail',
        emailRequired: 'E-mail je povinný, pokud chcete používat heslo',
        emailHelp: 'E-mail je povinný pouze pokud chcete používat přihlášení heslem.',
        emailPlaceholder: 'lekar@example.cz',
        city: 'Město ordinace',
        cityRequired: 'Město je povinné',
        cityPlaceholder: 'Praha',
        passwordLogin: 'Přihlášení heslem',
        passwordLoginHelp: 'Pokud není zaškrtnuto, můžete používat zabezpečený unikátní odkaz bez hesla.',
        newPassword: 'Nové heslo',
        confirmPassword: 'Potvrzení hesla',
        passwordPlaceholder: '********',
        passwordHelp: 'Ponechte prázdné, pokud nechcete měnit heslo.',
        uniqueLink: 'Váš unikátní odkaz',
        uniqueLinkHelp: 'Sdílejte pouze s oprávněnými osobami. Při změně nastavení se odkaz může změnit.',
        save: 'Uložit nastavení',
        saving: 'Ukládám...',
        saved: 'Nastavení bylo uloženo.',
        saveError: 'Nastavení se nepodařilo uložit',
        cityRequiredError: 'Město je povinné',
        emailRequiredError: 'E-mail je povinný, pokud chcete používat heslo',
        passwordMinLengthError: 'Heslo musí mít alespoň 8 znaků',
        passwordMismatchError: 'Hesla se neshodují',
      },
      feedback: {
        title: 'Seznam požadavků',
        subtitle: 'Přehled všech vašich odeslaných zpětných vazeb',
        newFeedback: 'Nová zpětná vazba',
        submitFirstFeedback: 'Odeslat první zpětnou vazbu',
        loading: 'Načítání zpětné vazby...',
        loadError: 'Nepodařilo se načíst zpětnou vazbu',
        noFeedback: 'Zatím jste neodeslali žádnou zpětnou vazbu.',
        adminResponse: 'Odpověď administrátora:',
        statusNew: 'Nový',
        statusInProgress: 'V řešení',
        statusResolved: 'Vyřešeno',
        statusClosed: 'Zavřeno',
        categoryBug: 'Chyba',
        categoryFeatureRequest: 'Požadavek na funkci',
        categoryQuestion: 'Dotaz',
        categoryOther: 'Jiné',
        submitNewTest: 'Zadat nový test',
        modal: {
          title: 'Odeslat zpětnou vazbu',
          category: 'Kategorie',
          categoryRequired: 'Kategorie*',
          subject: 'Předmět',
          subjectRequired: 'Předmět*',
          subjectPlaceholder: 'Krátký popis problému nebo požadavku',
          message: 'Zpráva',
          messageRequired: 'Zpráva*',
          messagePlaceholder: 'Podrobný popis problému, požadavku nebo dotazu...',
          cancel: 'Zrušit',
          submit: 'Odeslat',
          submitting: 'Odesílání...',
          submitted: 'Odesláno!',
          close: 'Zavřít',
          subjectRequiredError: 'Předmět je povinný',
          messageRequiredError: 'Zpráva je povinná',
          submitError: 'Nepodařilo se odeslat zpětnou vazbu',
          submitSuccess: 'Zpětná vazba byla úspěšně odeslána!',
        },
      },
    },
    auth: {
      title: 'Jak chcete pokračovat?',
      description:
        'Přihlaste se, pokud už máte schválený účet s heslem. Pokud účet ještě nemáte, můžete požádat o registraci. Po schválení získáte přístup přes heslo nebo zabezpečený odkaz.',
      haveAccount: {
        title: 'Mám účet',
        description: 'Přihlaste se pomocí e-mailu a hesla.',
        button: 'Přihlásit se',
      },
      noAccount: {
        title: 'Nemám účet',
        description: 'Požádejte o registraci. Můžete si zvolit přihlášení heslem nebo bezpečný odkaz.',
        button: 'Registrovat se',
      },
      uniqueLink: {
        title: 'Už máte unikátní odkaz?',
        description:
          'Pokud jste obdrželi osobní odkaz od administrátora, otevřete jej v tomto prohlížeči – formulář se zobrazí automaticky.',
      },
      login: {
        title: 'Přihlášení lékaře',
        description: 'Přihlaste se pomocí emailu a hesla',
        email: 'Email',
        password: 'Heslo',
        submit: 'Přihlásit se',
        submitting: 'Přihlašování...',
        invalidCredentials: 'Neplatné přihlašovací údaje',
        invalidCredentialsContact: 'Pro resetování přihlašovacích údajů nás kontaktujte:',
        contactEmail: 'podpora@joymed.cz',
        contactPhone: '+420 608 284 065',
        loginFailed: 'Přihlášení selhalo',
      },
    },
    form: {
      testType: 'Typ testu',
      testTypeRequired: 'Typ testu*',
      result: 'Výsledek',
      resultRequired: 'Výsledek*',
      resultPositive: 'Pozitivní',
      resultNegative: 'Negativní',
      resultInvalid: 'Neplatný',
      pathogen: 'Patogen',
      pathogenRequired: 'Patogen*',
      pathogenHelp: 'Při „Pozitivní" vyberte patogen. Při „Negativní/Neplatný" ponechte prázdné.',
      pathogenSelectFirst: 'Nejdříve vyberte typ testu',
      pathogenNoneAvailable: 'Pro vybraný typ testu nejsou k dispozici žádné patogeny',
      yearOfBirth: 'Ročník narození',
      yearOfBirthRequired: 'Ročník narození*',
      yearOfBirthPlaceholder: 'např. 1979',
      testDate: 'Datum testu',
      testDateRequired: 'Datum testu*',
      city: 'Město',
      cityRequired: 'Město*',
      cityPlaceholder: 'např. Praha',
      icpNumber: 'IČP',
      icpNumberRequired: 'IČP*',
      patientIdentifier: 'Identifikátor pacienta',
      patientIdentifierOptional: 'Identifikátor pacienta (nepovinné)',
      patientIdentifierTooltip: 'Interní označení pacienta doktorem. Nepoužívejte reálné údaje pacienta, jako např. rodné číslo.',
      patientIdentifierPlaceholder: 'Vyhledat nebo vytvořit pacienta...',
      patientIdentifierAriaLabel: 'Informace o identifikátoru pacienta',
      patientSearchFailed: 'Vyhledávání selhalo',
      patientCreateFailed: 'Vytvoření pacienta selhalo',
      patientIdentifierRequired: 'Identifikátor je povinný',
      patientCreating: 'Vytváření...',
      patientCreate: 'Vytvořit',
      patientCreateNew: 'Vytvořit nového pacienta:',
      patientNoteOptional: 'Poznámka (nepovinné)',
      patientYearOfBirthOptional: 'Ročník narození (nepovinné)',
      patientClearSelection: 'Zrušit výběr',
      patientSearching: 'Vyhledávání...',
      patientYearLabel: 'Ročník:',
      patientCreated: 'Pacient vytvořen',
      patientPressEnter: 'nebo stiskněte Enter',
      symptoms: 'Příznaky',
      symptomsRequired: 'Příznaky*',
      symptomsHelp: 'Příznaky a teplota jsou nepovinné',
      temperature: 'Teplota (°C)',
      temperatureRange: 'Rozsah: 35.0 - 42.0 °C',
      temperaturePlaceholder: 'např. 37.5',
      vaccination: 'Vakcína',
      vaccinationOptional: 'Vakcinace (nepovinné)',
      vaccinations: 'Vakcinace',
      addVaccination: 'Přidat vakcinaci',
      removeVaccination: 'Odebrat vakcinaci',
      vaccineName: 'Název vakcíny',
      vaccineNamePlaceholder: 'Např. Comirnaty, Spikevax',
      batchNumber: 'Šarže vakcíny',
      batchNumberPlaceholder: 'Např. ET1234',
      vaccinationDate: 'Datum vakcinace',
      vaccinationDatePlaceholder: 'DD.MM.RRRR',
      notes: 'Poznámky',
      notesPlaceholder: 'Doplňující poznámka...',
      additionalInfo: 'Další informace (nepovinné):',
      sari: 'SARI',
      atb: 'ATB',
      antivirals: 'Antivirotika',
      obesity: 'Obezita',
      respiratorySupport: 'Respirační podpora',
      ecmo: 'ECMO',
      pregnancy: 'Těhotenství',
      trimester: 'Trimestr',
      trimesterFirst: '1. Trimestr',
      trimesterSecond: '2. Trimestr',
      trimesterThird: '3. Trimestr',
      submit: 'Odeslat',
      submitting: 'Odesílání...',
      saving: 'Ukládání...',
      saveChanges: 'Uložit změny',
      success: 'Formulář byl úspěšně odeslán!',
      successEdit: 'Formulář byl úspěšně aktualizován!',
      error: 'Chyba při odesílání výsledku testu',
      errorEdit: 'Chyba při aktualizaci výsledku testu',
      validating: 'Ověřování odkazu...',
      authorized: '✓ Autorizováno',
      selectOption: '- vyberte -',
      sendFeedback: 'Odeslat zpětnou vazbu',
      // Validation errors
      testTypeRequiredError: 'Typ testu je povinný',
      resultRequiredError: 'Výsledek je povinný',
      yearOfBirthRequiredError: 'Ročník narození je povinný',
      cityRequiredError: 'Město je povinné',
      testDateRequiredError: 'Datum testu je povinné',
      pathogenRequiredError: 'Při pozitivním výsledku musíte vybrat patogen',
      symptomsRequiredError: 'Musíte vybrat alespoň jeden příznak nebo teplotu',
      icpNotAvailableError: 'ICP číslo není k dispozici. Prosím, přihlaste se znovu.',
      invalidLinkError: 'Neplatný odkaz. Otevřete stránku přes osobní odkaz z administrace nebo se přihlaste.',
    },
  },
  'en-US': {
    header: {
      title: 'IVD Test Results Reporting for Personal and Statistical Purposes',
      buyTests: 'Buy Tests',
      login: 'Sign in',
      logout: 'Sign out',
      testResults: 'Test Results',
      settings: 'Settings',
      newTest: 'New Test',
      newReport: 'New Report',
      languageSwitched: 'Language Changed',
      languageSwitchedMessage: 'Some data (e.g., test types, symptoms) will be translated after reloading the page.',
      reloadPage: 'Reload Page',
      dismiss: 'Dismiss',
      feedback: 'Feedback',
    },
    pages: {
      backToForm: 'Back to Form',
      backToList: 'Back to List',
      testResults: {
        title: 'Test Results',
        subtitle: 'Overview of all your submitted test results',
        filters: 'Filters',
        clearFilters: 'Clear Filters',
        search: 'Search',
        searchPlaceholder: 'Search by city, test type, pathogen, patient...',
        city: 'City',
        cityPlaceholder: 'Filter by city...',
        startDate: 'Start Date',
        endDate: 'End Date',
        showing: 'Showing:',
        of: 'of',
        results: 'results',
        page: 'page',
        ofPages: 'of',
        total: 'total',
        loading: 'Loading...',
        noResults: 'No test results found',
        exportAll: 'Download CSV (all results)',
        exporting: 'Exporting...',
        exportByPatient: 'Export by Patient',
        exportByPatientTitle: 'Export by Patient',
        selectPatient: 'Please select a patient',
        downloadCsv: 'Download CSV',
        edit: 'Edit',
        previous: 'Previous',
        next: 'Next',
        dateCreated: 'Date Created',
        testType: 'Test Type',
        pathogen: 'Pathogen',
        patient: 'Patient',
        yearOfBirth: 'Year of Birth',
        action: 'Action',
        charts: {
          positiveNegative: 'Positive vs Negative',
          positive: 'Positive',
          negative: 'Negative',
          loading: 'Loading...',
          noData: 'No data',
          positiveByAgeGroups: 'Positive Tests by Age Groups',
          age0to5: '0 - 5 years',
          age6to14: '6 - 14 years',
          age15to24: '15 - 24 years',
          age25to64: '25 - 64 years',
          age65plus: '65+ years',
          positiveByPathogens: 'Positive Tests by Pathogens',
          pathogen: 'Pathogen',
          positiveTrends: 'Positive Test Trends by Pathogens',
          total: 'Total',
          day: 'Days',
          week: 'Weeks',
          month: 'Months',
          allDoctors: 'All Doctors',
          onlyMine: 'Only Mine',
          allCzechRepublic: 'All of Czech Republic',
          entireRegion: 'Entire Region',
          selectRegion: 'Select Region',
          selectCity: 'Select City',
          region: 'Region',
          city: 'City',
          pathogenDistribution: 'Positive Pathogen Distribution',
          pathogensByAgeGroups: 'Positive Pathogens by Age Groups',
          me: 'Me',
          district: 'District',
          country: 'Country',
          comparison: 'Comparison with Colleagues',
        },
      },
      settings: {
        title: 'Profile Settings',
        subtitle: 'Manage login and contact information',
        profileSettings: 'Profile Settings',
        feedback: 'Feedback',
        feedbackDescription: 'Have a question, problem, or suggestion for improvement? You can send feedback directly here or on the feedback list page.',
        feedbackList: 'Feedback List',
        email: 'Email',
        emailRequired: 'Email is required if you want to use password',
        emailHelp: 'Email is required only if you want to use password login.',
        emailPlaceholder: 'doctor@example.com',
        city: 'Office City',
        cityRequired: 'City is required',
        cityPlaceholder: 'Prague',
        passwordLogin: 'Password Login',
        passwordLoginHelp: 'If unchecked, you can use a secure unique link without a password.',
        newPassword: 'New Password',
        confirmPassword: 'Confirm Password',
        passwordPlaceholder: '********',
        passwordHelp: 'Leave empty if you do not want to change the password.',
        uniqueLink: 'Your Unique Link',
        uniqueLinkHelp: 'Share only with authorized persons. The link may change when settings are changed.',
        save: 'Save Settings',
        saving: 'Saving...',
        saved: 'Settings have been saved.',
        saveError: 'Failed to save settings',
        cityRequiredError: 'City is required',
        emailRequiredError: 'Email is required if you want to use password',
        passwordMinLengthError: 'Password must be at least 8 characters',
        passwordMismatchError: 'Passwords do not match',
      },
      feedback: {
        title: 'Feedback List',
        subtitle: 'Overview of all your submitted feedback',
        newFeedback: 'New Feedback',
        submitFirstFeedback: 'Submit First Feedback',
        loading: 'Loading feedback...',
        loadError: 'Failed to load feedback',
        noFeedback: 'You have not submitted any feedback yet.',
        adminResponse: 'Administrator Response:',
        statusNew: 'New',
        statusInProgress: 'In Progress',
        statusResolved: 'Resolved',
        statusClosed: 'Closed',
        categoryBug: 'Bug',
        categoryFeatureRequest: 'Feature Request',
        categoryQuestion: 'Question',
        categoryOther: 'Other',
        submitNewTest: 'Submit New Test',
        modal: {
          title: 'Submit Feedback',
          category: 'Category',
          categoryRequired: 'Category*',
          subject: 'Subject',
          subjectRequired: 'Subject*',
          subjectPlaceholder: 'Brief description of the problem or request',
          message: 'Message',
          messageRequired: 'Message*',
          messagePlaceholder: 'Detailed description of the problem, request, or question...',
          cancel: 'Cancel',
          submit: 'Submit',
          submitting: 'Submitting...',
          submitted: 'Submitted!',
          close: 'Close',
          subjectRequiredError: 'Subject is required',
          messageRequiredError: 'Message is required',
          submitError: 'Failed to submit feedback',
          submitSuccess: 'Feedback has been successfully submitted!',
        },
      },
    },
    auth: {
      title: 'How would you like to proceed?',
      description:
        'Sign in if you already have an approved account with a password. If you do not have an account yet, you can request registration. After approval, you will gain access via password or secure link.',
      haveAccount: {
        title: 'I have an account',
        description: 'Sign in using your email and password.',
        button: 'Sign in',
      },
      noAccount: {
        title: 'I do not have an account',
        description: 'Request registration. You can choose password login or secure link.',
        button: 'Register',
      },
      uniqueLink: {
        title: 'Already have a unique link?',
        description:
          'If you have received a personal link from the administrator, open it in this browser – the form will appear automatically.',
      },
      login: {
        title: 'Doctor Login',
        description: 'Sign in using your email and password',
        email: 'Email',
        password: 'Password',
        submit: 'Sign in',
        submitting: 'Signing in...',
        invalidCredentials: 'Invalid credentials',
        invalidCredentialsContact: 'To reset your login credentials, please contact us:',
        contactEmail: 'podpora@joymed.cz',
        contactPhone: '+420 608 284 065',
        loginFailed: 'Login failed',
      },
    },
    form: {
      testType: 'Test Type',
      testTypeRequired: 'Test Type*',
      result: 'Result',
      resultRequired: 'Result*',
      resultPositive: 'Positive',
      resultNegative: 'Negative',
      resultInvalid: 'Invalid',
      pathogen: 'Pathogen',
      pathogenRequired: 'Pathogen*',
      pathogenHelp: 'For "Positive" select a pathogen. For "Negative/Invalid" leave empty.',
      pathogenSelectFirst: 'First select test type',
      pathogenNoneAvailable: 'No pathogens available for the selected test type',
      yearOfBirth: 'Year of Birth',
      yearOfBirthRequired: 'Year of Birth*',
      yearOfBirthPlaceholder: 'e.g. 1979',
      testDate: 'Test Date',
      testDateRequired: 'Test Date*',
      city: 'City',
      cityRequired: 'City*',
      cityPlaceholder: 'e.g. Prague',
      icpNumber: 'ICP Number',
      icpNumberRequired: 'ICP Number*',
      patientIdentifier: 'Patient Identifier',
      patientIdentifierOptional: 'Patient Identifier (optional)',
      patientIdentifierTooltip: 'Internal patient designation by doctor. Do not use real patient data, such as ID number.',
      patientIdentifierPlaceholder: 'Search or create patient...',
      patientIdentifierAriaLabel: 'Information about patient identifier',
      patientSearchFailed: 'Search failed',
      patientCreateFailed: 'Failed to create patient',
      patientIdentifierRequired: 'Identifier is required',
      patientCreating: 'Creating...',
      patientCreate: 'Create',
      patientCreateNew: 'Create new patient:',
      patientNoteOptional: 'Note (optional)',
      patientYearOfBirthOptional: 'Year of Birth (optional)',
      patientClearSelection: 'Clear selection',
      patientSearching: 'Searching...',
      patientYearLabel: 'Year:',
      patientCreated: 'Patient created',
      patientPressEnter: 'or press Enter',
      symptoms: 'Symptoms',
      symptomsRequired: 'Symptoms*',
      symptomsHelp: 'Symptoms and temperature are optional',
      temperature: 'Temperature (°C)',
      temperatureRange: 'Range: 35.0 - 42.0 °C',
      temperaturePlaceholder: 'e.g. 37.5',
      vaccination: 'Vaccination',
      vaccinationOptional: 'Vaccination (optional)',
      vaccinations: 'Vaccinations',
      addVaccination: 'Add vaccination',
      removeVaccination: 'Remove vaccination',
      vaccineName: 'Vaccine name',
      vaccineNamePlaceholder: 'e.g. Comirnaty, Spikevax',
      batchNumber: 'Batch number',
      batchNumberPlaceholder: 'e.g. ET1234',
      vaccinationDate: 'Vaccination date',
      vaccinationDatePlaceholder: 'DD.MM.YYYY',
      notes: 'Notes',
      notesPlaceholder: 'Additional note...',
      additionalInfo: 'Additional Information (optional):',
      sari: 'SARI',
      atb: 'ATB',
      antivirals: 'Antivirals',
      obesity: 'Obesity',
      respiratorySupport: 'Respiratory Support',
      ecmo: 'ECMO',
      pregnancy: 'Pregnancy',
      trimester: 'Trimester',
      trimesterFirst: '1st Trimester',
      trimesterSecond: '2nd Trimester',
      trimesterThird: '3rd Trimester',
      submit: 'Submit',
      submitting: 'Submitting...',
      saving: 'Saving...',
      saveChanges: 'Save Changes',
      success: 'Form was successfully submitted!',
      successEdit: 'Form was successfully updated!',
      error: 'Error submitting test result',
      errorEdit: 'Error updating test result',
      validating: 'Validating link...',
      authorized: '✓ Authorized',
      selectOption: '- select -',
      sendFeedback: 'Send Feedback',
      // Validation errors
      testTypeRequiredError: 'Test type is required',
      resultRequiredError: 'Result is required',
      yearOfBirthRequiredError: 'Year of birth is required',
      cityRequiredError: 'City is required',
      testDateRequiredError: 'Test date is required',
      pathogenRequiredError: 'You must select a pathogen for positive result',
      symptomsRequiredError: 'You must select at least one symptom or temperature',
      icpNotAvailableError: 'ICP number is not available. Please sign in again.',
      invalidLinkError: 'Invalid link. Open the page via personal link from administration or sign in.',
    },
  },
};

/**
 * Get translation for a given language code
 */
export function getTranslations(language: LanguageCode): Translations {
  return translations[language] || translations['cs-CZ'];
}

/**
 * Get default language from browser or cookie
 */
export function getDefaultLanguage(): LanguageCode {
  if (typeof window === 'undefined') {
    return 'cs-CZ';
  }

  // Try to get from localStorage
  const stored = localStorage.getItem('language');
  if (stored === 'cs-CZ' || stored === 'en-US') {
    return stored;
  }

  // Fallback to browser language
  const browserLang = navigator.language || 'cs-CZ';
  if (browserLang.startsWith('en')) {
    return 'en-US';
  }
  return 'cs-CZ';
}

/**
 * Set language preference
 */
export function setLanguage(language: LanguageCode): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', language);
  }
}

