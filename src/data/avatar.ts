// The learner's picture (decision 179): a photo chosen on Profile, cropped to a square in the
// middle and shrunk on this device, so what syncs is a JPEG of about 10 KB.

export const AVATAR_SIZE = 160;
/** The server refuses anything longer (supabase/migrations/20261105090000_profile_name_avatar.sql). */
const MAX_LENGTH = 60000;
export const NAME_MAX = 40;

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That file could not be opened as a picture.'));
    };
    img.src = url;
  });
}

/** A square JPEG data URL of the picture's middle, AVATAR_SIZE pixels across. */
export async function avatarFromFile(file: Blob): Promise<string> {
  const img = await loadImage(file);
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  if (!side) throw new Error('That picture is empty.');
  const canvas = document.createElement('canvas');
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser cannot resize pictures.');
  ctx.drawImage(
    img,
    (img.naturalWidth - side) / 2,
    (img.naturalHeight - side) / 2,
    side,
    side,
    0,
    0,
    AVATAR_SIZE,
    AVATAR_SIZE,
  );
  for (const quality of [0.85, 0.7, 0.5]) {
    const url = canvas.toDataURL('image/jpeg', quality);
    if (url.length <= MAX_LENGTH) return url;
  }
  throw new Error('That picture is too detailed to save. Try another one.');
}
