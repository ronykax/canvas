export interface VaultTree {
  dirs: string[];
  files: string[];
}

export interface VaultApi {
  onTree: (listener: (tree: VaultTree) => void) => () => void;
  tree: () => Promise<VaultTree>;
}
