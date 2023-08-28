import { ethers } from "hardhat"
import { expect, assert } from "chai"
import { SimpleStorage, SimpleStorage__factory } from "../typechain-types"

describe("SimpleStorage", function () {
    let simpleStorageFactory: SimpleStorage__factory
    let simpleStorage: SimpleStorage

    beforeEach(async function () {
        simpleStorageFactory = (await ethers.getContractFactory(
            "SimpleStorage",
        )) as unknown as SimpleStorage__factory
        simpleStorage = await simpleStorageFactory.deploy()
    })

    it("Should start with a favorite number of 0", async function () {
        const currentValue = await simpleStorage.retrieve()
        const expectedValue = "0"
        assert.equal(currentValue.toString(), expectedValue)
        // expect version of the above "assert"
        // expect(currentValue.toString()).to.equal(expectedValue)
    })
    it("Should update when we call store", async function () {
        const expectedValue = "7"
        const transactionResponse = await simpleStorage.store(expectedValue)
        await transactionResponse.wait(1)
        const currentValue = await simpleStorage.retrieve()
        assert.equal(currentValue.toString(), expectedValue)
    })
    it("Should add a person to the people array", async function () {
        const person = { name: "Matt", favoriteNumber: BigInt(33) }
        const transactionResponse = await simpleStorage.addPerson(
            person.name,
            person.favoriteNumber,
        )
        await transactionResponse.wait(1)
        const onChainPerson = await simpleStorage.people(0)
        assert.equal(onChainPerson.name, person.name)
        assert.equal(onChainPerson.favoriteNumber, person.favoriteNumber)
    })
    it("Should allow for query of a person's favorite number", async function () {
        const person = { name: "Matt", favoriteNumber: BigInt(33) }
        const transactionResponse = await simpleStorage.addPerson(
            person.name,
            person.favoriteNumber,
        )
        await transactionResponse.wait(1)

        const favoriteNumber = await simpleStorage.nameToFavoriteNumber(
            person.name,
        )
        assert.equal(favoriteNumber, person.favoriteNumber)
    })
})
