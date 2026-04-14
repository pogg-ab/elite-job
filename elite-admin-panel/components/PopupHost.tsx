'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { registerPopupHandler, type PopupRequest } from '@/lib/popup'

type QueueItem = {
  request: PopupRequest
  resolve: (value: unknown) => void
}

export default function PopupHost() {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [promptValue, setPromptValue] = useState('')

  useEffect(() => {
    return registerPopupHandler((request) => {
      return new Promise((resolve) => {
        setQueue((prev) => [...prev, { request, resolve }])
      })
    })
  }, [])

  const current = queue[0]

  useEffect(() => {
    if (!current) return
    setPromptValue(current.request.defaultValue ?? '')
  }, [current])

  const closeCurrent = (value: unknown) => {
    if (!current) return

    current.resolve(value)
    setQueue((prev) => prev.slice(1))
  }

  const isAlert = current?.request.type === 'alert'
  const isPrompt = current?.request.type === 'prompt'
  const isConfirm = current?.request.type === 'confirm'

  const title = useMemo(() => {
    if (!current) return ''
    if (current.request.title) return current.request.title
    if (isConfirm) return 'Please Confirm'
    if (isPrompt) return 'Input Required'
    return 'Notice'
  }, [current, isConfirm, isPrompt])

  return (
    <>
      <Dialog open={Boolean(current && (isAlert || isPrompt))} onOpenChange={(open) => { if (!open) closeCurrent(isPrompt ? null : undefined) }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{current?.request.message}</DialogDescription>
          </DialogHeader>

          {isPrompt && (
            <input
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              placeholder={current?.request.placeholder || ''}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
            />
          )}

          <DialogFooter>
            {isPrompt && (
              <Button variant="outline" onClick={() => closeCurrent(null)}>
                Cancel
              </Button>
            )}
            <Button onClick={() => closeCurrent(isPrompt ? promptValue : undefined)} className="bg-primary text-primary-foreground">
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(current && isConfirm)} onOpenChange={(open) => { if (!open) closeCurrent(false) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{current?.request.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => closeCurrent(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => closeCurrent(true)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
