export const translations = {
  en: {
    // Login page
    login: {
      title: 'Orion',
      subtitle: 'Multi-Agentic AI Interface',
      userIdLabel: 'User ID',
      userIdPlaceholder: 'Enter your user ID',
      tenantIdLabel: 'Tenant ID',
      tenantIdOptional: '(optional)',
      tenantIdPlaceholder: 'Enter tenant ID (optional)',
      continueButton: 'Continue',
      demoText: 'AI Powered Solution by CherifCorp Technologies',
      required: '*',
    },

    // Chat window
    chat: {
      title: 'Orion',
      tenant: 'Tenant',
      clearButton: 'Clear',
      logoutButton: 'Logout',
      clearConfirm: 'Are you sure you want to clear the chat history?',
      infoBannerTitle: 'This UI calls only',
      infoBannerText: 'Messages are sent to ORCHA, which returns a routing decision with the recommended endpoint and prepared payload. The "Call Recommended Endpoint" button is a placeholder (see TODO in src/api/orcha.ts).',
    },

    // Message list
    messages: {
      emptyTitle: 'No messages yet',
      emptySubtitle: 'Send a message to see Orion in action',
    },

    // Message input
    input: {
      placeholder: 'Type a message...',
      useRag: 'Use RAG',
      useRagTooltip: '(Retrieval-Augmented Generation)',
      helpText: 'Press Enter to send, Shift+Enter for new line. Supports images and PDFs.',
      attachFiles: 'Attach files',
      sendMessage: 'Send message',
      attachmentOptions: 'Attachment options',
      attachDocumentOrImage: 'Attach document or image',
      attachDocument: 'Attach Document',
      ocrMode: 'OCR',
      extractingText: 'Extracting text...',
      ocrFailed: 'Failed to extract text from image',
      selectImageFile: 'Please select an image file',
      fileSizeTooLarge: 'File size must be less than 10MB',
      failedToProcess: 'Failed to process image',
    },

    // Routing message
    routing: {
      title: 'ORCHA Routing Decision',
      endpoint: 'Recommended Endpoint:',
      reason: 'Reason:',
      statusInfo: 'Status Information:',
      status: 'Status:',
      ocrQueued: 'OCR Queued:',
      jobIds: 'Job IDs:',
      preparedPayload: 'Prepared Payload:',
      copy: 'Copy',
      copied: 'Copied!',
      expand: 'Expand',
      collapse: 'Collapse',
      callEndpoint: 'Call Recommended Endpoint',
      demoMode: '(Demo mode - See TODO in src/api/orcha.ts)',
      yes: 'Yes',
      no: 'No',
    },

    // Badges
    badges: {
      ocr: 'OCR',
      rag: 'RAG',
      chat: 'CHAT',
      api: 'API',
    },

    // Assistant message
    assistant: {
      sources: 'Sources:',
      thinking: 'Thinking',
      ocrQueued: 'Processing attachments... Job IDs:',
      errorTitle: 'Error',
    },

    // Sidebar
    sidebar: {
      newChat: 'New Chat',
      deleteChat: 'Delete chat',
      confirmDelete: 'Click again to confirm',
      noChats: 'No conversations yet',
      chatCount: 'conversation(s)',
      openSidebar: 'Open sidebar',
      closeSidebar: 'Close sidebar',
    },

    // OCR Extractor
    ocr: {
      title: 'OCR Text Extractor',
      subtitle: 'Upload images to extract text using AI-powered OCR',
      languageDetection: 'Language Detection',
      documentType: 'Document Type',
      docTypePassport: 'Passport',
      docTypeIdCard: 'ID Card',
      docTypeOther: 'Other Document',
      imagePreview: 'Image Preview',
      chooseImage: 'Choose Image',
      extractText: 'Extract Text',
      processing: 'Processing...',
      clear: 'Clear',
      extractedText: 'Extracted Text',
      cleanedData: 'AI Cleaned Data',
      cleaningData: 'Cleaning and extracting information...',
      copy: 'Copy',
      copied: 'Copied!',
      lines: 'Lines',
      language: 'Language',
      file: 'File',
      error: 'Error',
      errorMessage: 'Failed to extract text from image',
      fileTypeError: 'Please select an image file',
      fileSizeError: 'File size must be less than 10MB',
      selectImageError: 'Please select an image first',
    },

    // Pulse Feature
    pulse: {
      title: 'Pulse',
      buttonTooltip: 'View Daily Pulse',
      regenerateTooltip: 'Regenerate Pulse',
      closeTooltip: 'Close',
      analyzing: 'Analyzing your conversations...',
      analyzingSubtext: 'This may take up to 30 seconds',
      tryAgain: 'Try Again',
      noPulseData: 'No pulse data available',
      noPulseSubtext: 'Click the refresh button to generate your first pulse summary',
      metadataGenerated: 'Generated',
      metadataConversations: 'Conversations',
      metadataMessages: 'Messages',
      metadataNextUpdate: 'Next Update',
    },

    // Model Selector
    modelSelector: {
      title: 'Models',
    },



    // Orion Assist
    orionAssist: {
      welcome: "Hi {userName}! I'm here to help. What do you need?",
      greeting: "Hello! I'm Orion - Chrysus, your personal data collection assistant. I'll help gather some information from you.",
      askName: "To get started, could you please tell me your name?",
      askAge: "Great! Now, may I ask how old you are?",
      askGender: "Thank you! What is your gender?",
      askNationality: "And what is your nationality?",
      askLocation: "Finally, where are you currently located?",
      thankYou: "Thank you for providing all the information! I'm now processing your details...",
      extractionComplete: "Here's a summary of the information you provided:",
      extractionSystemPrompt: "Analyze the provided conversation history. Extract the user's Name, Age, Gender, Nationality, and Location. Return the output as a structured summary with the values highlighted in Markdown bold.",
      dataFields: {
        name: "Name",
        age: "Age",
        gender: "Gender",
        nationality: "Nationality",
        location: "Location",
      },
    },
  },

  fr: {
    // Login page
    login: {
      title: 'Orion',
      subtitle: 'Interface IA Multi-Agentique',
      userIdLabel: 'ID Utilisateur',
      userIdPlaceholder: 'Entrez votre ID utilisateur',
      tenantIdLabel: 'ID Locataire',
      tenantIdOptional: '(optionnel)',
      tenantIdPlaceholder: 'Entrez l\'ID locataire (optionnel)',
      continueButton: 'Continuer',
      demoText: 'Solution IA Propulsée par CherifCorp Technologies',
      required: '*',
    },

    // Chat window
    chat: {
      title: 'Orion',
      tenant: 'Locataire',
      clearButton: 'Effacer',
      logoutButton: 'Déconnexion',
      clearConfirm: 'Êtes-vous sûr de vouloir effacer l\'historique des conversations ?',
      infoBannerTitle: 'Cette interface appelle uniquement',
      infoBannerText: 'Les messages sont envoyés à ORCHA, qui retourne une décision de routage avec le point de terminaison recommandé et la charge utile préparée. Le bouton "Appeler le point de terminaison recommandé" est un espace réservé (voir TODO dans src/api/orcha.ts).',
    },

    // Message list
    messages: {
      emptyTitle: 'Aucun message pour le moment',
      emptySubtitle: 'Envoyez un message pour voir Orion en action',
    },

    // Message input
    input: {
      placeholder: 'Tapez un message...',
      useRag: 'Utiliser RAG',
      useRagTooltip: '(Génération Augmentée par Récupération)',
      helpText: 'Appuyez sur Entrée pour envoyer, Maj+Entrée pour nouvelle ligne. Prend en charge les images et les PDF.',
      attachFiles: 'Joindre des fichiers',
      sendMessage: 'Envoyer le message',
      attachmentOptions: 'Options de pièce jointe',
      attachDocumentOrImage: 'Joindre un document ou une image',
      attachDocument: 'Joindre un Document',
      ocrMode: 'OCR',
      extractingText: 'Extraction du texte...',
      ocrFailed: 'Échec de l\'extraction du texte de l\'image',
      selectImageFile: 'Veuillez sélectionner un fichier image',
      fileSizeTooLarge: 'La taille du fichier doit être inférieure à 10 Mo',
      failedToProcess: 'Échec du traitement de l\'image',
    },

    // Routing message
    routing: {
      title: 'Décision de Routage ORCHA',
      endpoint: 'Point de terminaison recommandé :',
      reason: 'Raison :',
      statusInfo: 'Informations sur le statut :',
      status: 'Statut :',
      ocrQueued: 'OCR en file d\'attente :',
      jobIds: 'ID des tâches :',
      preparedPayload: 'Charge utile préparée :',
      copy: 'Copier',
      copied: 'Copié !',
      expand: 'Développer',
      collapse: 'Réduire',
      callEndpoint: 'Appeler le point de terminaison recommandé',
      demoMode: '(Mode démo - Voir TODO dans src/api/orcha.ts)',
      yes: 'Oui',
      no: 'Non',
    },

    // Badges
    badges: {
      ocr: 'OCR',
      rag: 'RAG',
      chat: 'CHAT',
      api: 'API',
    },

    // Assistant message
    assistant: {
      sources: 'Sources :',
      thinking: 'Réflexion',
      ocrQueued: 'Traitement des pièces jointes... ID des tâches :',
      errorTitle: 'Erreur',
    },

    // Sidebar
    sidebar: {
      newChat: 'Nouvelle conversation',
      deleteChat: 'Supprimer la conversation',
      confirmDelete: 'Cliquez à nouveau pour confirmer',
      noChats: 'Aucune conversation pour le moment',
      chatCount: 'conversation(s)',
      openSidebar: 'Ouvrir la barre latérale',
      closeSidebar: 'Fermer la barre latérale',
    },

    // OCR Extractor
    ocr: {
      title: 'Extracteur de Texte OCR',
      subtitle: 'Téléchargez des images pour extraire du texte avec l\'OCR alimenté par l\'IA',
      languageDetection: 'Détection de Langue',
      documentType: 'Type de Document',
      docTypePassport: 'Passeport',
      docTypeIdCard: 'Carte d\'Identité',
      docTypeOther: 'Autre Document',
      imagePreview: 'Aperçu de l\'Image',
      chooseImage: 'Choisir une Image',
      extractText: 'Extraire le Texte',
      processing: 'Traitement...',
      clear: 'Effacer',
      extractedText: 'Texte Extraît',
      cleanedData: 'Données Nettoyées par IA',
      cleaningData: 'Nettoyage et extraction des informations...',
      copy: 'Copier',
      copied: 'Copié !',
      lines: 'Lignes',
      language: 'Langue',
      file: 'Fichier',
      error: 'Erreur',
      errorMessage: 'Échec de l\'extraction de texte de l\'image',
      fileTypeError: 'Veuillez sélectionner un fichier image',
      fileSizeError: 'La taille du fichier doit être inférieure à 10 Mo',
      selectImageError: 'Veuillez d\'abord sélectionner une image',
    },

    // Pulse Feature
    pulse: {
      title: 'Pulse',
      buttonTooltip: 'Voir le Pulse Quotidien',
      regenerateTooltip: 'Régénérer le Pulse',
      closeTooltip: 'Fermer',
      analyzing: 'Analyse de vos conversations...',
      analyzingSubtext: 'Cela peut prendre jusqu\'à 30 secondes',
      tryAgain: 'Réessayer',
      noPulseData: 'Aucune donnée de pulse disponible',
      noPulseSubtext: 'Cliquez sur le bouton actualiser pour générer votre premier résumé pulse',
      metadataGenerated: 'Généré',
      metadataConversations: 'Conversations',
      metadataMessages: 'Messages',
      metadataNextUpdate: 'Prochaine Mise à Jour',
    },

    // Model Selector
    modelSelector: {
      title: 'Modèles',
    },



    // Orion Assist
    orionAssist: {
      welcome: "Salut {userName} ! Je suis là pour t'aider. De quoi as-tu besoin ?",
      greeting: "Bonjour ! Je suis Orion - Chrysus, votre assistant de collecte de données personnel. Je vais vous aider à recueillir quelques informations.",
      askName: "Pour commencer, pourriez-vous me dire votre nom ?",
      askAge: "Très bien ! Puis-je vous demander votre âge ?",
      askGender: "Merci ! Quel est votre genre ?",
      askNationality: "Et quelle est votre nationalité ?",
      askLocation: "Enfin, où êtes-vous actuellement situé(e) ?",
      thankYou: "Merci d'avoir fourni toutes les informations ! Je traite maintenant vos détails...",
      extractionComplete: "Voici un résumé des informations que vous avez fournies :",
      extractionSystemPrompt: "Analysez l'historique de la conversation fourni. Extrayez le Nom, l'Âge, le Genre, la Nationalité et la Localisation de l'utilisateur. Retournez le résultat sous forme de résumé structuré avec les valeurs en gras Markdown.",
      dataFields: {
        name: "Nom",
        age: "Âge",
        gender: "Genre",
        nationality: "Nationalité",
        location: "Localisation",
      },
    },
  },

  ar: {
    // Login page
    login: {
      title: 'Orion',
      subtitle: 'واجهة الذكاء الاصطناعي متعددة الوكلاء',
      userIdLabel: 'معرّف المستخدم',
      userIdPlaceholder: 'أدخل معرّف المستخدم',
      tenantIdLabel: 'معرّف المستأجر',
      tenantIdOptional: '(اختياري)',
      tenantIdPlaceholder: 'أدخل معرّف المستأجر (اختياري)',
      continueButton: 'متابعة',
      demoText: 'حل مدعوم بالذكاء الاصطناعي من CherifCorp Technologies',
      required: '*',
    },

    // Chat window
    chat: {
      title: 'Orion',
      tenant: 'المستأجر',
      clearButton: 'مسح',
      logoutButton: 'تسجيل الخروج',
      clearConfirm: 'هل أنت متأكد من رغبتك في مسح سجل المحادثات؟',
      infoBannerTitle: 'هذه الواجهة تستدعي فقط',
      infoBannerText: 'يتم إرسال الرسائل إلى ORCHA، الذي يُرجع قرار التوجيه مع نقطة النهاية الموصى بها والحمولة المُعدة.',
    },

    // Message list
    messages: {
      emptyTitle: 'لا توجد رسائل بعد',
      emptySubtitle: 'أرسل رسالة لترى Orion في العمل',
    },

    // Message input
    input: {
      placeholder: 'اكتب رسالة...',
      useRag: 'استخدام RAG',
      useRagTooltip: '(التوليد المعزز بالاسترجاع)',
      helpText: 'اضغط Enter للإرسال، Shift+Enter لسطر جديد. يدعم الصور وملفات PDF.',
      attachFiles: 'إرفاق ملفات',
      sendMessage: 'إرسال الرسالة',
      attachmentOptions: 'خيارات المرفقات',
      attachDocumentOrImage: 'إرفاق مستند أو صورة',
      attachDocument: 'إرفاق مستند',
      ocrMode: 'OCR',
      extractingText: 'جارٍ استخراج النص...',
      ocrFailed: 'فشل استخراج النص من الصورة',
      selectImageFile: 'يرجى اختيار ملف صورة',
      fileSizeTooLarge: 'يجب أن يكون حجم الملف أقل من 10 ميجابايت',
      failedToProcess: 'فشل معالجة الصورة',
    },

    // Routing message
    routing: {
      title: 'قرار توجيه ORCHA',
      endpoint: 'نقطة النهاية الموصى بها:',
      reason: 'السبب:',
      statusInfo: 'معلومات الحالة:',
      status: 'الحالة:',
      ocrQueued: 'OCR في قائمة الانتظار:',
      jobIds: 'معرّفات المهام:',
      preparedPayload: 'الحمولة المُعدة:',
      copy: 'نسخ',
      copied: 'تم النسخ!',
      expand: 'توسيع',
      collapse: 'طي',
      callEndpoint: 'استدعاء نقطة النهاية الموصى بها',
      demoMode: '(وضع العرض التوضيحي)',
      yes: 'نعم',
      no: 'لا',
    },

    // Badges
    badges: {
      ocr: 'OCR',
      rag: 'RAG',
      chat: 'محادثة',
      api: 'API',
    },

    // Assistant message
    assistant: {
      sources: 'المصادر:',
      thinking: 'جارٍ التفكير',
      ocrQueued: 'جارٍ معالجة المرفقات... معرّفات المهام:',
      errorTitle: 'خطأ',
    },

    // Sidebar
    sidebar: {
      newChat: 'محادثة جديدة',
      deleteChat: 'حذف المحادثة',
      confirmDelete: 'انقر مرة أخرى للتأكيد',
      noChats: 'لا توجد محادثات بعد',
      chatCount: 'محادثة(ات)',
      openSidebar: 'فتح الشريط الجانبي',
      closeSidebar: 'إغلاق الشريط الجانبي',
    },

    // OCR Extractor
    ocr: {
      title: 'مستخرج نص OCR',
      subtitle: 'ارفع صورًا لاستخراج النص باستخدام OCR المدعوم بالذكاء الاصطناعي',
      languageDetection: 'اكتشاف اللغة',
      documentType: 'نوع المستند',
      docTypePassport: 'جواز سفر',
      docTypeIdCard: 'بطاقة هوية',
      docTypeOther: 'مستند آخر',
      imagePreview: 'معاينة الصورة',
      chooseImage: 'اختر صورة',
      extractText: 'استخراج النص',
      processing: 'جارٍ المعالجة...',
      clear: 'مسح',
      extractedText: 'النص المستخرج',
      cleanedData: 'البيانات المنظفة بالذكاء الاصطناعي',
      cleaningData: 'جارٍ التنظيف واستخراج المعلومات...',
      copy: 'نسخ',
      copied: 'تم النسخ!',
      lines: 'الأسطر',
      language: 'اللغة',
      file: 'الملف',
      error: 'خطأ',
      errorMessage: 'فشل استخراج النص من الصورة',
      fileTypeError: 'يرجى اختيار ملف صورة',
      fileSizeError: 'يجب أن يكون حجم الملف أقل من 10 ميجابايت',
      selectImageError: 'يرجى اختيار صورة أولاً',
    },

    // Pulse Feature
    pulse: {
      title: 'Pulse',
      buttonTooltip: 'عرض Pulse اليومي',
      regenerateTooltip: 'إعادة توليد Pulse',
      closeTooltip: 'إغلاق',
      analyzing: 'جارٍ تحليل محادثاتك...',
      analyzingSubtext: 'قد يستغرق هذا حتى 30 ثانية',
      tryAgain: 'حاول مرة أخرى',
      noPulseData: 'لا تتوفر بيانات Pulse',
      noPulseSubtext: 'انقر على زر التحديث لإنشاء أول ملخص Pulse',
      metadataGenerated: 'تم الإنشاء',
      metadataConversations: 'المحادثات',
      metadataMessages: 'الرسائل',
      metadataNextUpdate: 'التحديث التالي',
    },

    // Model Selector
    modelSelector: {
      title: 'النماذج',
    },

    // Orion Assist
    orionAssist: {
      welcome: "مرحباً {userName}! أنا هنا للمساعدة. ماذا تحتاج؟",
      greeting: "مرحباً! أنا Orion - Themis، مساعدك الشخصي لجمع البيانات. سأساعدك في جمع بعض المعلومات.",
      askName: "للبدء، هل يمكنك إخباري باسمك؟",
      askAge: "رائع! هل يمكنني معرفة عمرك؟",
      askGender: "شكراً! ما هو جنسك؟",
      askNationality: "وما هي جنسيتك؟",
      askLocation: "أخيراً، أين تتواجد حالياً؟",
      thankYou: "شكراً لتقديم جميع المعلومات! أقوم الآن بمعالجة بياناتك...",
      extractionComplete: "إليك ملخص المعلومات التي قدمتها:",
      extractionSystemPrompt: "حلل سجل المحادثة المقدم. استخرج الاسم والعمر والجنس والجنسية والموقع للمستخدم. أرجع النتيجة كملخص منظم مع القيم بخط عريض Markdown.",
      dataFields: {
        name: "الاسم",
        age: "العمر",
        gender: "الجنس",
        nationality: "الجنسية",
        location: "الموقع",
      },
    },
  },
};

export type TranslationKey = keyof typeof translations.en;

