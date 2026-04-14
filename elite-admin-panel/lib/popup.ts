'use client'

type PopupType = 'alert' | 'confirm' | 'prompt'

export type PopupRequest = {
  type: PopupType
  title?: string
  message: string
  defaultValue?: string
  placeholder?: string
}

type PopupHandler = (request: PopupRequest) => Promise<any>

let popupHandler: PopupHandler | null = null

export function registerPopupHandler(handler: PopupHandler) {
  popupHandler = handler

  return () => {
    if (popupHandler === handler) {
      popupHandler = null
    }
  }
}

export async function showAlert(message: string, title = 'Notice'): Promise<void> {
  if (!popupHandler) {
    if (typeof window !== 'undefined') {
      window.alert(message)
    }
    return
  }

  await popupHandler({ type: 'alert', title, message })
}

export async function showConfirm(message: string, title = 'Please Confirm'): Promise<boolean> {
  if (!popupHandler) {
    if (typeof window !== 'undefined') {
      return window.confirm(message)
    }
    return false
  }

  return Boolean(await popupHandler({ type: 'confirm', title, message }))
}

export async function showPrompt(
  message: string,
  defaultValue = '',
  title = 'Input Required',
  placeholder = ''
): Promise<string | null> {
  if (!popupHandler) {
    if (typeof window !== 'undefined') {
      return window.prompt(message, defaultValue)
    }
    return null
  }

  const result = await popupHandler({
    type: 'prompt',
    title,
    message,
    defaultValue,
    placeholder,
  })

  return typeof result === 'string' ? result : null
}
