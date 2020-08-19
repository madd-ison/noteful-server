const foldersService = {
    getAllFolders(knex) {
        return knex
            .select('*')
            .from('folders')
    },
    getFolderById(knex, id) {
        return knex
            .from('folders')
            .where('id', id)
            .first()
    },
    addFolder(knex, folder) {
        return knex
            .from('folders')
            .insert(folder)
            .returning('*')
            .then(folder => folder[0])
    },
    deleteFolder(knex, id) {
        return knex
            .from('folders')
            .where('id', id)
            .delete()
    },
    updatefolder(knex, id, folder) {
        return knex
            .from('folders')
            .where('id', id)
            .update(folder)
    }
}   

module.exports = foldersService