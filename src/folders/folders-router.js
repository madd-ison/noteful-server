const express = require('express')
const xss = require('xss')
const logger = require('../logger')
const foldersService = require('./folders-service')

const foldersRouter = express.Router()
const bodyParser = express.json()

const serializeFolder = folder => ({
    id: folder.id,
    name: xss(folder.name)
})

foldersRouter
    .route('/')
    .get((req, res, next) => {
        const knex = req.app.get('db')
        foldersService.getAllFolders(knex)
        .then(folders => res.json(folders.map(serializeFolder)))
        .catch(next)
    })
    .post(bodyParser, (req, res, next) => {
        for (const field of ['name']) {
            if (!req.body[field]) {
                logger.error(`${field} is missing for folders post`)
                return res.status(400).json({error: { message: `${field} is missing` }})
            }
        }
        const newfolder = {
            name: xss(req.body.name)
        }
        foldersService.addFolder(req.app.get('db'), newfolder)
            .then(folder => {
                console.log('folder', folder)
                logger.info(`folder with id ${folder.id} created`)
                res
                    .status(201)
                    .location(`/folders/${folder.id}`)
                    .json(folder)
                    
            })
            .catch(next)
    })

foldersRouter
    .route('/:folder_id')
    .all((req, res, next) => {
        const { folder_id } = req.params
        foldersService.getFolderById(req.app.get('db'), folder_id)
            .then(folder => {
                if (!folder) {
                    logger.error(`folder with id ${folder_id} not found`)
                    return res
                        .status(404)
                        .json({error: { message: 'folder not found' }})
                }
                res.folder = folder
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {
        const folder = res.folder
        res.json(serializeFolder(folder))
    })
    .delete((req, res, next) => {
        const { folder_id } = req.params
        foldersService.deleteFolder(req.app.get('db'), folder_id)
            .then(() => {
                logger.info(`folder with id ${folder_id} deleted`)
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(bodyParser, (req, res, next) => {
        const folderUpdates = req.body
        console.log('folderupdates', folderUpdates)
        if (Object.keys(folderUpdates).length == 0) {
            logger.info(`folder must have values to update`)
            return res.status(400).json({
                error: { message: `patch request must supply values`}
            })
        }
        foldersService.updatefolder(req.app.get('db'), res.folder.id, folderUpdates)
            .then(updatedfolder => {
                logger.info(`folder with id ${res.folder.id} updated`)
                res.status(204).end()
            })
    })

module.exports = foldersRouter