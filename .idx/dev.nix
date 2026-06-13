# .idx/dev.nix
{ pkgs, ... }: {
  # Paquets disponibles dans l'environnement
  packages = [
    pkgs.nodejs_20
    pkgs.npm-check-updates
  ];

  # Extensions VS Code à installer
  idx = {
    extensions = [
      "dbaeumer.vscode-eslint"
      "esbenp.prettier-vscode"
      "bradlc.vscode-tailwindcss"
    ];

    # Commandes à exécuter au démarrage de l'espace de travail
    workspace = {
      onCreate = {
        default = ''
          npm install
        '';
      };
      onStart = {
        default = ''
          npm run dev
        '';
      };
    };

    # Configuration des previews
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm" "run" "dev" "--" "--port" "$PORT" "--host" "0.0.0.0"];
          manager = "web";
        };
      };
    };
  };
}