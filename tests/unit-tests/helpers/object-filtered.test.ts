import { getFilterObjectWithAllowedKeys } from "../../../src/helpers";

describe("getFilterObjectWithAllowedKeys tests", () => {
    it("should return expected", () => {
        // arrange
        const object = { key1: "value1", key2: "value2", key3: "value3", key4: "value4" };
        const allowKeys = ["key2", "key4"];
        const expected = { key2: "value2", key4: "value4" };

        // act
        const actual = getFilterObjectWithAllowedKeys(object, allowKeys);

        // assert
        expect(actual).toEqual(expected);
    });
});
