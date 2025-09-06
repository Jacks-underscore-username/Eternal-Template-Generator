{
  description = "Development environment for debugging Glass";
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.11";
  };
  outputs = {
    self,
    nixpkgs,
    ...
  }: let
    system = "x86_64-linux";

    pkgs = nixpkgs.legacyPackages.${system};
  in {
    devShells.${system}.default = pkgs.mkShell {
      nativeBuildInputs = with pkgs; [bun chromium];

      shellHook = ''
        export BROWSER_PATH="${pkgs.chromium}/bin"
        echo "${pkgs.chromium}"
      '';
    };
  };
}
