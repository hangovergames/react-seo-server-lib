import { StaticReactAppService } from "./StaticReactAppService";

describe("StaticReactAppService", () => {

    describe("renderString", () => {

        it("should render the static React app to a string", () => {
            const url = "/test";
            const App = () => <div>Test</div>;
            const expectedResult = "<div>Test</div>";

            const result = StaticReactAppService.renderString(url, App);

            expect(result).toBe(expectedResult);
        });

    });

});
