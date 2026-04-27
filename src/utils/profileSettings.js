import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

const PROFILE_REF = doc(db, 'settings', 'profile')

export async function getProfile() {
  try {
    const snap = await getDoc(PROFILE_REF)
    if (!snap.exists()) return { avatarBase64: null }
    const data = snap.data()
    return { avatarBase64: data.avatarBase64 || null }
  } catch (e) {
    console.error('getProfile failed', e)
    return { avatarBase64: null }
  }
}

export async function saveAvatar(base64OrNull) {
  await setDoc(
    PROFILE_REF,
    { avatarBase64: base64OrNull, updatedAt: serverTimestamp() },
    { merge: true }
  )
}
