import path from "path";
import { fileURLToPath } from "url";
import HtmlWebpackPlugin from "html-webpack-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: "development",
  entry: "./src/index.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
    fallback: {
      path: false,
      fs: false,
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html",
      filename: "index.html",
      inject: "body",
      minify: {
        collapseWhitespace: false,
        removeComments: false,
      },
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "node_modules/litegraph.js/css/litegraph.css",
          to: "css",
        },
        {
          from: "node_modules/litegraph.js/build/litegraph.js",
          to: "js",
        },
      ],
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, "dist"),
    },
    port: 2112,
    hot: true,
    open: true,
    compress: true,
  },
  devtool: "source-map",
};
