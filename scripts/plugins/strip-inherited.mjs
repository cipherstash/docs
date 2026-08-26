// @ts-check
import { Converter } from "typedoc";

/**
 * Drop inherited members from the generated reference.
 *
 * TypeDoc copies every inherited member into each subclass, and the Markdown
 * theme renders those copies in full. The EQL v3 column surface is 41 thin
 * subclasses of `EncryptedV3Column`, so each one repeated the base
 * constructor and all of its methods: any two of those sections differed by
 * 18 lines out of 464, and the family alone accounted for 344 KB of the
 * 366 KB `eql.v3` module page. That page rendered to 14.6 MB of HTML — 97% of
 * Googlebot's 15 MB fetch limit — which is why the generated reference stopped
 * being indexed.
 *
 * With inherited members removed, a subclass documents only what it declares.
 * Nothing is lost from the site: the `Extends` line on the subclass links to
 * the base class page, where those members are documented once.
 *
 * TypeDoc has no built-in option for this. `visibilityFilters.inherited` is a
 * runtime toggle in the HTML theme (the members are still emitted), and
 * `tableColumnSettings.hideInherited` only affects table columns. Removing the
 * reflections after resolution is the supported way to do it for any theme.
 *
 * @param {import('typedoc').Application} app
 */
export function load(app) {
  app.converter.on(Converter.EVENT_RESOLVE_END, (context) => {
    const project = context.project;

    // Snapshot first: removeReflection mutates the project's reflection map.
    const inherited = Object.values(project.reflections).filter(
      (reflection) =>
        "inheritedFrom" in reflection && reflection.inheritedFrom != null,
    );

    for (const reflection of inherited) {
      // A member removed with its owner (an inherited signature's parent, say)
      // is already gone by the time the loop reaches it.
      if (project.reflections[reflection.id] === reflection) {
        project.removeReflection(reflection);
      }
    }

    app.logger.info(
      `[strip-inherited] removed ${inherited.length} inherited members`,
    );
  });
}
