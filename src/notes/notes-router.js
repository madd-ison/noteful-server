const express = require('express')
const xss = require('xss')
const logger = require('../logger')
const notesService = require('./notes-service')

const notesRouter = express.Router()
const bodyParser = express.json()

const serializeNote = note => ({
    id: note.id,
    title: xss(note.title),
    content: xss(note.content),
    date_created: xss(note.date_created),
    folder_id: note.folder_id
})

notesRouter
    .route('/')
    .get((req, res, next) => {
        const knex = req.app.get('db')
        notesService.getAllNotes(knex)
        .then(notes => res.json(notes.map(serializeNote)))
        .catch(next)
    })
    .post(bodyParser, (req, res, next) => {
        for (const field of ['title', 'content', 'folder_id']) {
            if (!req.body[field]) {
                logger.error(`${field} is missing for notes post`)
                return res.status(400).json({error: { message: `${field} is missing` }})
            }
        }
        const newNote = {
            title: xss(req.body.title),
            content: xss(req.body.content),
            folder_id: req.body.folder_id
        }
        notesService.addNote(req.app.get('db'), newNote)
            .then(note => {
                console.log('note', note)
                logger.info(`note with id ${note.id} created`)
                res
                    .status(201)
                    .location(`/notes/${note.id}`)
                    .json(note)
                    
            })
            .catch(next)
    })

notesRouter
    .route('/:note_id')
    .all((req, res, next) => {
        const { note_id } = req.params
        notesService.getNoteById(req.app.get('db'), note_id)
            .then(note => {
                if (!note) {
                    logger.error(`Note with id ${note_id} not found`)
                    return res
                        .status(404)
                        .json({error: { message: 'Note not found' }})
                }
                res.note = note
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {
        const note = res.note
        res.json(serializeNote(note))
    })
    .delete((req, res, next) => {
        const { note_id } = req.params
        notesService.deleteNote(req.app.get('db'), note_id)
            .then(() => {
                logger.info(`note with id ${note_id} deleted`)
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(bodyParser, (req, res, next) => {
        const noteUpdates = req.body
        console.log('noteupdates', noteUpdates)
        if (Object.keys(noteUpdates).length == 0) {
            logger.info(`note must have values to update`)
            return res.status(400).json({
                error: { message: `patch request must supply values`}
            })
        }
        notesService.updateNote(req.app.get('db'), res.note.id, noteUpdates)
            .then(updatedNote => {
                logger.info(`note with id ${res.note.id} updated`)
                res.status(204).end()
            })
    })

module.exports = notesRouter