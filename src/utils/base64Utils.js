// src/utils/base64Utils.js

// Fonction utilitaire pour convertir un fichier en Base64
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      try {
        const result = reader.result;
        console.log('Base64 conversion successful:', {
          filename: file.name,
          originalSize: file.size,
          base64Length: result.length,
          mimeType: file.type
        });
        resolve(result);
      } catch (error) {
        console.error('Error in fileToBase64:', error);
        reject(error);
      }
    };
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      reject(error);
    };
  });
};

// Fonction utilitaire pour reconvertir Base64 en File - VERSION CORRIGÉE
export const base64ToFile = (base64String, filename, mimeType) => {
  try {
    console.log('Starting base64ToFile conversion:', {
      filename,
      mimeType,
      base64Length: base64String.length,
      hasDataPrefix: base64String.includes('data:')
    });

    // Vérifier que nous avons bien une chaîne Base64
    if (!base64String || typeof base64String !== 'string') {
      throw new Error('Base64 string is invalid or empty');
    }

    // Extraire les données base64 (supprimer le préfixe data:mime/type;base64,)
    let base64Data;
    if (base64String.includes(',')) {
      base64Data = base64String.split(',')[1];
    } else {
      base64Data = base64String;
    }

    // Vérifier que nous avons des données après la split
    if (!base64Data) {
      throw new Error('No base64 data found after splitting');
    }

    console.log('Base64 data extracted:', {
      dataLength: base64Data.length,
      firstChars: base64Data.substring(0, 20)
    });

    // Décoder les données base64
    let byteCharacters;
    try {
      byteCharacters = atob(base64Data);
    } catch (decodeError) {
      console.error('Base64 decode error:', decodeError);
      throw new Error(`Invalid base64 data: ${decodeError.message}`);
    }

    console.log('Base64 decoded successfully:', {
      decodedLength: byteCharacters.length
    });

    // Vérifier que nous avons des données décodées
    if (byteCharacters.length === 0) {
      throw new Error('Decoded base64 data is empty');
    }

    // Convertir en tableau de bytes
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    
    console.log('Byte array created:', {
      byteArrayLength: byteArray.length,
      firstBytes: Array.from(byteArray.slice(0, 10))
    });

    // Créer le fichier
    const file = new File([byteArray], filename, { type: mimeType });
    
    console.log('File created successfully:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });

    // Vérification finale
    if (file.size === 0) {
      throw new Error('Created file has 0 size - conversion failed');
    }

    return file;
    
  } catch (error) {
    console.error('Error in base64ToFile conversion:', {
      error: error.message,
      filename,
      mimeType,
      base64Preview: base64String.substring(0, 100) + '...'
    });
    throw new Error(`Failed to convert Base64 to file for ${filename}: ${error.message}`);
  }
};

// Fonction de validation des données Base64
export const validateBase64Data = (base64String, filename) => {
  if (!base64String) {
    throw new Error(`No Base64 data for ${filename}`);
  }
  
  if (typeof base64String !== 'string') {
    throw new Error(`Invalid Base64 data type for ${filename}`);
  }
  
  // Vérifier le format data URL
  if (!base64String.startsWith('data:')) {
    throw new Error(`Invalid Base64 format for ${filename} - missing data URL prefix`);
  }
  
  // Vérifier qu'il y a des données après la virgule
  const parts = base64String.split(',');
  if (parts.length !== 2 || !parts[1]) {
    throw new Error(`Invalid Base64 format for ${filename} - missing data after comma`);
  }
  
  return true;
};