const path = require("path");
const { VueLoaderPlugin } = require("vue-loader");

module.exports = {
  entry: {
    app: path.resolve(__dirname, "src", "main.ts"),
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: "vue-loader",
      },
      {
        test: /\.ts$/,
        loader: "babel-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.scss$/,
        use: ["vue-style-loader", "css-loader", "sass-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".js", ".ts", ".vue"],
  },
  output: {
    filename: "weather-widget.bundle.js",
    path: path.resolve(__dirname, "dist"),
    publicPath: "/dist",
    clean: true,
  },
  devServer: {
    port: 3000,
  },
  plugins: [new VueLoaderPlugin()],
};
