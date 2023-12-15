import supertest from 'supertest'
import createServer from '../server';

const app = createServer() 

describe('user', () => {
    describe('Get Users Route', () => {
        describe("given the user does not exist", () => {
            it("should return a 404", async () => {
                const userId = '827383838abx2838'
                await supertest(app).get('/api/v1/users').expect(404)
            })
        })
    })
})