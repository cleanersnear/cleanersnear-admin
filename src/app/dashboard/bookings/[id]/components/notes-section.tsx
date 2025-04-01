'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format } from 'date-fns'
import { toast } from 'react-hot-toast'
import { 
  TrashIcon, 
  PencilIcon,   
  DocumentPlusIcon
 
} from '@heroicons/react/24/outline'

type Note = {
  note_text: string
  note_added_by: string
  note_created_at: string
}

type NotesSectionProps = {
  bookingId: string
  notes: Note
  onNotesUpdate: (updatedNotes: Note) => void
}

export default function NotesSection({ bookingId, notes, onNotesUpdate }: NotesSectionProps) {
  const [noteText, setNoteText] = useState('')
  const [editingNote, setEditingNote] = useState<{ index: number; text: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClientComponentClient()

  const handleAddNote = async () => {
    if (!noteText.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      // First check if the record exists
      const { error: checkError } = await supabase
        .from('booking_admin_details')
        .select('*')
        .eq('booking_id', bookingId)
        .single()

      if (checkError) {
        console.error('Error checking existing record:', checkError)
        throw checkError
      }

      // Prepare the note data
      const noteData = {
        note_text: noteText.trim(),
        note_added_by: 'Admin',
        note_created_at: new Date().toISOString()
      }

      // Update the record
      const { data, error } = await supabase
        .from('booking_admin_details')
        .update(noteData)
        .eq('booking_id', bookingId)
        .select()
        .single()

      if (error) {
        console.error('Error updating note:', error)
        throw error
      }

      if (!data) {
        throw new Error('No data returned from update')
      }

      onNotesUpdate({
        note_text: data.note_text,
        note_added_by: data.note_added_by,
        note_created_at: data.note_created_at
      })
      
      setNoteText('')
      toast.success('Note added successfully')
    } catch (error) {
      console.error('Error adding note:', error)
      toast.error('Failed to add note. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAddNote()
    }
  }

  const handleEditNote = async () => {
    if (!editingNote || isSubmitting) return

    setIsSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('booking_admin_details')
        .update({
          note_text: editingNote.text.trim(),
          note_created_at: new Date().toISOString()
        })
        .eq('booking_id', bookingId)
        .select()
        .single()

      if (error) throw error

      onNotesUpdate({
        ...notes,
        note_text: data.note_text,
        note_created_at: data.note_created_at
      })
      setEditingNote(null)
      toast.success('Note updated successfully')
    } catch (error) {
      console.error('Error updating note:', error)
      toast.error('Failed to update note')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteNote = async () => {
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('booking_admin_details')
        .update({
          note_text: null,
          note_added_by: null,
          note_created_at: null
        })
        .eq('booking_id', bookingId)

      if (error) throw error

      onNotesUpdate({
        note_text: '',
        note_added_by: '',
        note_created_at: ''
      })
      toast.success('Note deleted successfully')
    } catch (error) {
      console.error('Error deleting note:', error)
      toast.error('Failed to delete note')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Notes Display */}
      <div className="space-y-3 mb-4">
        {notes.note_text ? (
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
            {editingNote ? (
              <div className="space-y-3">
                <textarea
                  value={editingNote.text}
                  onChange={(e) => setEditingNote({ ...editingNote, text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  disabled={isSubmitting}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setEditingNote(null)}
                    className="px-3 py-1.5 text-gray-600 hover:text-gray-800"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditNote}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    disabled={isSubmitting || !editingNote.text.trim()}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-900 whitespace-pre-wrap">{notes.note_text}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{notes.note_added_by}</span>
                    <span>•</span>
                    <span>{format(new Date(notes.note_created_at), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingNote({ index: 0, text: notes.note_text })}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      disabled={isSubmitting}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleDeleteNote}
                      className="p-1 text-red-400 hover:text-red-600 transition-colors"
                      disabled={isSubmitting}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>

      {/* Add Note Section */}
      <div className="relative">
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={3}
          placeholder="Add a note... (Press Enter to send)"
          disabled={isSubmitting}
        />
        <button 
          onClick={handleAddNote}
          disabled={!noteText.trim() || isSubmitting}
          className="absolute bottom-3 right-3 p-2 text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Add note"
        >
          <DocumentPlusIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
} 