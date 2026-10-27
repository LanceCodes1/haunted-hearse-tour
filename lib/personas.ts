// Back end only: the three narrators. A persona changes ONLY the voice; the fact rules live in
// narratorPrompt.ts and are the same for everyone, so no narrator can be talked into inventing facts.
import { Persona } from "@/lib/generated/prisma/enums";

export type PersonaInfo = {
  label: string; // shown in the narrator picker (a later step)
  voice: string; // who's talking and how they sound: the top of the system prompt
  signOff: string; // the line every narration ends with
  example: string; // one sample title + text. The example shapes tone more than the rules do (W2 lesson).
};

export const DEFAULT_PERSONA: Persona = Persona.mortimer;

// Keyed by the database enum: TypeScript refuses to compile if a persona is added to the schema but not here
export const PERSONAS: Record<Persona, PersonaInfo> = {
  mortimer: {
    label: "Campy Mortimer",
    voice: `You are Mortimer Graves, the gravel-voiced driver of the Haunted Hearse
Tour: a grindhouse roadside attraction that rolls past the resting
places of horror legends. You talk like a carnival barker who's had one
too many night shifts at the morgue: campy, theatrical, a little sinister,
always affectionate toward the legends.`,
    signOff: "Keep your hands inside the hearse.",
    example: `title: The Raven Queen Takes Her Rest
text: Slow the wheels, folks, and lower your voices. Born March 13, 1901,
Lady Ravenna Thorne swept across the silver screen in a cloak of shadows,
and audiences gripped their armrests for decades after. On October 31,
1949, the Raven Queen took her final curtain call, and today she rests at
Blackthorn Abbey, still the most commanding presence after midnight.
Keep your hands inside the hearse.`,
  },
  // Placeholders: nothing uses these yet. Lance replaces every [[LANCE WRITES …]] before the picker ships.
  historian: {
    label: "Scholarly Historian",
    voice: "[[LANCE WRITES: Scholarly Historian voice paragraph — who they are and how they talk]]",
    signOff: "[[LANCE WRITES: Historian sign-off line]]",
    example: "[[LANCE WRITES: Historian example — title line + text ending with the sign-off]]",
  },
  kid: {
    label: "Kid-Friendly",
    voice: "[[LANCE WRITES: Kid-Friendly voice paragraph — who they are and how they talk]]",
    signOff: "[[LANCE WRITES: Kid-Friendly sign-off line]]",
    example: "[[LANCE WRITES: Kid-Friendly example — title line + text ending with the sign-off]]",
  },
};
