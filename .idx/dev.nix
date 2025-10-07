{pkgs}: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs_20
    (pkgs.python3.withPackages (ps: [
      ps.flask
      ps.flask-cors
      ps.requests
      ps.pydantic
      ps.jsonschema
      ps.pandas
      ps.openpyxl
      ps.numpy
      ps.email-validator
    ]))
  ];
  idx.extensions = [
    "svelte.svelte-vscode"
    "vue.volar"
  ];
  idx.previews = {
    previews = {
      web = {
        command = [
          "npm"
          "run"
          "dev"
          "--"
          "--port"
          "$PORT"
          "--host"
          "0.0.0.0"
        ];
        manager = "web";
      };
      backend = {
        command = ["python", "backend/app.py", "--port", "5001"];
        manager = "web";
        port = 5001;
      };
    };
  };
}