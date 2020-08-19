const notesService = {
    getAllNotes(knex) {
        return knex
            .select('*')
            .from('notes')
    },
    getNoteById(knex, id) {
        return knex
            .from('notes')
            .where('id', id)
            .first()
    },
    addNote(knex, note) {
        return knex
            .from('notes')
            .insert(note)
            .returning('*')
            .then(note => note[0])
    },
    deleteNote(knex, id) {
        return knex
            .from('notes')
            .where('id', id)
            .delete()
    },
    updateNote(knex, id, note) {
        return knex
            .from('notes')
            .where('id', id)
            .update(note)
    }
}   

module.exports = notesService