{
  description = "Org-mate development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    devshell.url = "github:numtide/devshell";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, devshell, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [ devshell.overlays.default ];
        };
      in
      {
        devShells.default = pkgs.devshell.mkShell {
          name = "org-mate";
          packages = with pkgs; [
            bun
          ];
          commands = [
            {
              name = "dev";
              help = "Run the development server";
              command = "bun run index.ts chat";
            }
          ];
        };
      });
}
