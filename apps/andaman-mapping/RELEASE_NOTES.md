## Andaman Mapping – Version 1 – Original (1.0.5)

1.0.5: all original images and fliers now come by themselves. The Images and Fliers tabs fetch each picture from the public Pictures and Fliers pack on the IBIN Apps releases page the first time it is shown (internet needed once; the computer keeps a copy for offline use). Installing the pack is no longer needed; an installed pack folder is still used when present. Everything else is as before.

1.0.4: closer to the 2015 program. Thematic and grid maps use the original's six shades (cyan to dark green) with natural-break ranges and an "Andaman_Grid by …" legend ("0 to 3", "3 to 18" …). New Point Select Info tool (the "i" button) shows a grid's sheet, area and species counts. A readout under the map shows zoom, scale and cursor position. Everything else is as 1.0.3 (below).

1.0.3: the link to the Google Drive image folder is removed from the Images and Fliers tabs. Everything else is as 1.0.2 (below).

**New in 1.0.2: the Pictures and Fliers pack.** The program can now show all the original images (19,502: herbarium sheets, line diagrams, paintings, field photographs) and all the fliers (2,218 slides) of each species, from a separate pack kept on your own computer.
- The pack is **independent of the program**: it is installed once, with its own Setup (Windows), and is not re-downloaded when the program is updated.
- **Windows:** run `AndamanMapping_Pictures_1.0.0_Setup.exe` (with its `-1.bin`, `-2.bin`, `-3.bin` files in the same folder). It installs into `%LOCALAPPDATA%\AndamanMapping\pack`, which the program finds by itself. Or put a folder called `pack` next to `AndamanMapping.exe`.
- **Offline folder (any computer):** put the `pack` folder next to `Open Kit.html`.
- Without the pack nothing changes: one picture per species, as before.


The Windows Setup now uses the same kind of installer wizard as the 2015 program, built with Inno Setup. It still installs without an administrator password. The program itself is unchanged.

The 2015 Andaman Mapping program ("Distribution, Taxonomy & Diversity of Plants of Andaman", Andaman Resource Assessment and Mapping) rebuilt so that it looks and works as the original did, and now runs on Windows, Mac and Ubuntu, in a browser, and offline. It no longer needs MapInfo.

Proprietary right holder: Dr. K.N. Ganeshaiah · Updated in 2026 by Dr. Sachin A. Rosario

### What it contains (all from the original database and map files)
- **2,213 plant species** with genus, family and habit (tree, herb, shrub, epiphyte, regeneration).
- **Data Recovery Modules**: Gridwise Search and Textform Search (genus and species, habit, or common name by language), as in the original.
- **Gridwise Search**: the map of the Andaman Islands in grids (3.75 minute); select grids by clicking or dragging a box and see the species recorded in them, by habit, with species, genus and family counts. Layers: grids, places, roads, rivers.
- **Thematic Maps**: number of species recorded in each grid, by habit.
- **For every species**: Taxonomic hierarchy, distribution map, Images, Fliers, Distribution data (flora and forest range/division), Synonym data (with the flora that records each name) and Common names (35,000 names in many languages).
- **Pictures**: one representative picture of each species is shown in the program. All original images (herbarium sheets, line diagrams, paintings and field photographs, 19,000 files) and the fliers are kept in the IBIN data repository on Google Drive, with the link shown on each species' Images and Fliers pages.

### Downloads
| File | For |
|---|---|
| `AndamanMapping_1.0.1_Setup.exe` | Windows 10/11: installs, no administrator password |
| `AndamanMapping.exe` | Windows: runs without installing |
| `AndamanMapping_1.0.1_universal.dmg` | macOS (Intel and Apple silicon) |
| `AndamanMapping_1.0.1_amd64.deb` | Ubuntu 22.04 or newer |
| `AndamanMapping_1.0.1_offline.zip` | Any computer: extract, then open `Open Kit.html` |

Version 1 keeps the original's screens and behaviour. Updated plant names (Catalogue of Life), phone-friendly design and GIS export are planned for Version 2.
