import { Connection } from "typeorm";

export async function AddDatabaseTriggers(connection: Connection) {
    await connection.transaction(async (conn) => {
        await conn.query(
            `CREATE OR REPLACE FUNCTION clear_fake_user()
                RETURNS TRIGGER AS
            $BODY$
            BEGIN
                TRUNCATE TABLE fake_user;
            RETURN NULL;
            END;
            $BODY$ LANGUAGE plpgsql;`
        );
        await conn.query(
            `DROP TRIGGER IF EXISTS auto_delete ON fake_user`
        );
        await conn.query(
            `CREATE TRIGGER auto_delete
            AFTER INSERT ON fake_user
            FOR EACH STATEMENT
            EXECUTE PROCEDURE clear_fake_user();`,
         );
    });
};
