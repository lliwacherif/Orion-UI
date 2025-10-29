export const translations = {
  en: {
    // Login page
    login: {
      title: 'AURA',
      subtitle: 'Multi-Agentic AI Interface',
      userIdLabel: 'User ID',
      userIdPlaceholder: 'Enter your user ID',
      tenantIdLabel: 'Tenant ID',
      tenantIdOptional: '(optional)',
      tenantIdPlaceholder: 'Enter tenant ID (optional)',
      continueButton: 'Continue',
      demoText: 'AI Powered Solution by VAERDIA',
      required: '*',
    },
    
    // Chat window
    chat: {
      title: 'AURA',
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
      emptySubtitle: 'Send a message to see AURA in action',
    },
    
    // Message input
    input: {
      placeholder: 'Type a message... (Shift+Enter for new line)',
      useRag: 'Use RAG',
      useRagTooltip: '(Retrieval-Augmented Generation)',
      helpText: 'Press Enter to send, Shift+Enter for new line. Supports images and PDFs.',
      attachFiles: 'Attach files',
      sendMessage: 'Send message',
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
      title: '(BETA) OCR Text Extractor',
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
  },
  
  fr: {
    // Login page
    login: {
      title: 'AURA',
      subtitle: 'Interface IA Multi-Agentique',
      userIdLabel: 'ID Utilisateur',
      userIdPlaceholder: 'Entrez votre ID utilisateur',
      tenantIdLabel: 'ID Locataire',
      tenantIdOptional: '(optionnel)',
      tenantIdPlaceholder: 'Entrez l\'ID locataire (optionnel)',
      continueButton: 'Continuer',
      demoText: 'Solution IA Propulsée par VAERDIA',
      required: '*',
    },
    
    // Chat window
    chat: {
      title: 'AURA',
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
      emptySubtitle: 'Envoyez un message pour voir AURA en action',
    },
    
    // Message input
    input: {
      placeholder: 'Tapez un message... (Maj+Entrée pour nouvelle ligne)',
      useRag: 'Utiliser RAG',
      useRagTooltip: '(Génération Augmentée par Récupération)',
      helpText: 'Appuyez sur Entrée pour envoyer, Maj+Entrée pour nouvelle ligne. Prend en charge les images et les PDF.',
      attachFiles: 'Joindre des fichiers',
      sendMessage: 'Envoyer le message',
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
      title: '(BETA) Extracteur de Texte OCR',
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
  },
};

export type TranslationKey = keyof typeof translations.en;

