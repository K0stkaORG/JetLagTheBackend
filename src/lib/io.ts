import { styleText } from "node:util";

const serverReady = () => {
	console.clear();

	console.log(`
${styleText(
	["bold"],
	`              =%@%=
           *@@@#:#@@@*
       :*@@@@@%   %@@@@@#:
    -%@@@@@@@@%   %@@@@@@@@%-
  *@@@@@@@@@@@%   %@@@@@@@@@@@*     ***:   =***=    -*
  @@@@@@@@@@#       #@@@@@@@@@@    *@@@#   #@@%@@%  #@:
  @@@@@@@+             *@@@@@@@    @@:#%   #@=  @@= #@:
  @@@@@@@.+%%@=   =@%%+ @@@@@@@    @@ *@:  #@=  @@= #@:
  @@@@@@@@@@@@=   =@@@@@@@@@@@@   :@% =@=  #@=  @@= #@:
  @@@@@@@@@@@@     %@@@@@@@@@@@   #@# .@*  #@@@@@%  #@:
  @@@@@@@@@@@.      @@@@@@@@@@@   @@@@@@%  #@=      #@:
  @@@@@@@@@-         -@@@@@@@@@   @@.  %@. #@=      #@:
  %                           *  :@@   *@= #@=      #@:
  *+                         +*
    =%=                   +%=
       :#*             ##-
          .##.     .##.
              +#*#+
`
)}

       ${styleText(["bold"], "JetLag: The App Server is running on ports:")}
                  🔄️ WebSocket: ${process.env.WS_PORT}
                   🛏️  REST API: ${process.env.SERVER_PORT}

`);
};

const withTimestamp = (message: string) => `${styleText(["gray", "dim"], `[${new Date().toLocaleString()}]`)} ${message}`;

const flatten = (arr: any[], noPadding?: true) =>
	arr
		.map((e) => (typeof e === "object" ? JSON.stringify(e, null, 2) : e.toString().split("\n")))
		.flat(1)
		.join(noPadding ? "\x1b[0m\n   \x1b[91;1;4m" : "\n" + new String(" ").repeat(new Date().toLocaleString().length + 3));

const log = (...message: any[]) => console.log(withTimestamp(styleText(["gray"], flatten(message))));

const warn = (...message: any[]) => console.log(withTimestamp(styleText(["yellowBright", "bold", "italic"], "⚠️  Warning: " + flatten(message))));

const error = (...message: any[]) => {
	console.log("\n\n❗ " + styleText(["redBright", "bold", "underline"], "Error: " + flatten(message, true)) + "\x1b[31;2m");
	console.log(`\nTimestamp\n   ${new Date().toLocaleString()}`);
	console.trace();
	console.log("\x1b[0m\n");
};

export const io = {
	serverReady,
	log,
	warn,
	error,
};
