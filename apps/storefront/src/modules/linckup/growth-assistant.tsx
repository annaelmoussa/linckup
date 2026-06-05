"use client"

import { useActionState } from "react"

import { askGrowthAssistant } from "../../lib/linckup/actions"

type AssistantState = {
  question?: string
  answer?: string
}

const initialState: AssistantState = {}

export default function GrowthAssistant({ merchantId }: { merchantId: string }) {
  const [state, formAction, pending] = useActionState(
    askGrowthAssistant,
    initialState
  )

  return (
    <section className="rounded-lg border border-[#d8ded2] bg-white p-5">
      <div className="flex flex-col gap-2">
        <p className="text-small-semi uppercase text-[#667263]">
          Assistant IA de croissance
        </p>
        <h2 className="text-xl-semi">Demande une lecture simple</h2>
      </div>
      <form action={formAction} className="mt-5 flex flex-col gap-3">
        <input type="hidden" name="merchantId" value={merchantId} />
        <label className="sr-only" htmlFor="question">
          Question
        </label>
        <textarea
          id="question"
          name="question"
          className="min-h-24 rounded-md border border-[#cbd6cc] p-3 text-base-regular outline-none focus:border-[#00a957]"
          defaultValue="Comment se passe ma dynamique d'avis cette semaine ?"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-11 rounded-md bg-[#062716] px-4 text-base-semi text-white disabled:opacity-60"
        >
          {pending ? "Analyse en cours" : "Analyser"}
        </button>
      </form>
      {state.answer && (
        <div className="mt-5 rounded-md bg-[#e9fff3] p-4 text-base-regular text-[#123c27]">
          {state.answer}
        </div>
      )}
    </section>
  )
}
